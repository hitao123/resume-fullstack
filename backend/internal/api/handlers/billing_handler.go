package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/api/middleware"
	"github.com/henryhua/resume-backend/internal/api/response"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/internal/service"
	"github.com/henryhua/resume-backend/pkg/database"
)

type BillingHandler struct{}

func NewBillingHandler() *BillingHandler {
	return &BillingHandler{}
}

func (h *BillingHandler) GetPlans(c *gin.Context) {
	var plans []models.Plan
	if err := database.DB.Where("active = ?", true).Order("price_monthly ASC").Find(&plans).Error; err != nil {
		response.Internal(c, "PLANS_FETCH_FAILED", "Failed to fetch plans")
		return
	}

	result := make([]dto.PlanResponse, 0, len(plans))
	for _, plan := range plans {
		result = append(result, dto.PlanResponse{
			Code:                  plan.Code,
			Name:                  plan.Name,
			PriceMonthly:          plan.PriceMonthly,
			PriceYearly:           plan.PriceYearly,
			ResumeLimit:           plan.ResumeLimit,
			AIQuotaMonthly:        plan.AIQuotaMonthly,
			TemplateLimit:         plan.TemplateLimit,
			AllowDuplicate:        plan.AllowDuplicate,
			AllowCustomSections:   plan.AllowCustomSections,
			AllowCertifications:   plan.AllowCertifications,
			AllowLanguages:        plan.AllowLanguages,
			AllowAwards:           plan.AllowAwards,
			AllowHdPdf:            plan.AllowHdPdf,
			AllowJdOptimization:   plan.AllowJdOptimization,
			AllowMultiLanguage:    plan.AllowMultiLanguage,
			AllowPriorityFeatures: plan.AllowPriorityFeatures,
		})
	}

	response.Success(c, http.StatusOK, result)
}

func (h *BillingHandler) Checkout(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", err.Error())
		return
	}

	var plan models.Plan
	if err := database.DB.Where("code = ? AND active = ?", req.PlanCode, true).First(&plan).Error; err != nil {
		response.NotFound(c, "PLAN_NOT_FOUND", "Plan not found")
		return
	}

	amount := plan.PriceMonthly
	if req.BillingCycle == "yearly" {
		amount = plan.PriceYearly
	}

	order := models.PaymentOrder{
		UserID:       userID,
		PlanID:       plan.ID,
		Amount:       amount,
		Status:       "pending",
		BillingCycle: req.BillingCycle,
		Provider:     req.Provider,
	}
	if err := database.DB.Create(&order).Error; err != nil {
		response.Internal(c, "ORDER_CREATE_FAILED", "Failed to create order")
		return
	}

	intent, err := service.NewPaymentService().CreatePaymentIntent(context.Background(), order, plan, req.Provider)
	if err != nil {
		if limitErr, ok := err.(*service.LimitError); ok {
			response.Forbidden(c, limitErr.Code, limitErr.Message, limitErr.Details)
			return
		}
		response.Internal(c, "PAYMENT_INTENT_CREATE_FAILED", err.Error())
		return
	}

	response.Success(c, http.StatusOK, dto.CheckoutResponse{
		OrderID:       order.ID,
		PlanCode:      plan.Code,
		PlanName:      plan.Name,
		BillingCycle:  req.BillingCycle,
		Amount:        amount,
		PaymentStatus: order.Status,
		Provider:      req.Provider,
		CheckoutURL:   intent.CheckoutURL,
		CodeURL:       intent.CodeURL,
		FormHTML:      intent.FormHTML,
		SessionID:     intent.SessionID,
	})
}

func (h *BillingHandler) PayOrder(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.PayOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", err.Error())
		return
	}

	var order models.PaymentOrder
	if err := database.DB.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&order).Error; err != nil {
		response.NotFound(c, "ORDER_NOT_FOUND", "Order not found")
		return
	}
	if order.Status == "paid" {
		response.Success(c, http.StatusOK, gin.H{"status": "paid"})
		return
	}

	var plan models.Plan
	if err := database.DB.First(&plan, order.PlanID).Error; err != nil {
		response.NotFound(c, "PLAN_NOT_FOUND", "Plan not found")
		return
	}

	now := time.Now().UTC()
	tx := database.DB.Begin()

	if err := tx.Model(&models.UserSubscription{}).
		Where("user_id = ? AND status = ?", userID, "active").
		Update("status", "expired").Error; err != nil {
		tx.Rollback()
		response.Internal(c, "SUBSCRIPTION_UPDATE_FAILED", "Failed to update old subscription")
		return
	}

	subscription := models.UserSubscription{
		UserID:       userID,
		PlanID:       plan.ID,
		Status:       "active",
		BillingCycle: order.BillingCycle,
		StartAt:      now,
	}
	if err := tx.Create(&subscription).Error; err != nil {
		tx.Rollback()
		response.Internal(c, "SUBSCRIPTION_CREATE_FAILED", "Failed to create new subscription")
		return
	}

	order.Status = "paid"
	order.Provider = req.Provider
	order.PaidAt = &now
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		response.Internal(c, "ORDER_PAY_FAILED", "Failed to complete payment")
		return
	}

	tx.Commit()

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		response.Internal(c, "USER_FETCH_FAILED", "Failed to fetch upgraded user")
		return
	}
	userInfo, err := service.BuildUserInfo(user)
	if err != nil {
		response.Internal(c, "PROFILE_BUILD_FAILED", "Failed to build upgraded profile")
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"orderId": order.ID,
		"status":  order.Status,
		"user":    userInfo,
	})
}

func (h *BillingHandler) GetOrders(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var orders []models.PaymentOrder
	if err := database.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(10).Find(&orders).Error; err != nil {
		response.Internal(c, "ORDERS_FETCH_FAILED", "Failed to fetch orders")
		return
	}

	results := make([]dto.OrderResponse, 0, len(orders))
	for _, order := range orders {
		var plan models.Plan
		_ = database.DB.First(&plan, order.PlanID).Error
		item := dto.OrderResponse{
			ID:           order.ID,
			PlanCode:     plan.Code,
			PlanName:     plan.Name,
			Amount:       order.Amount,
			Status:       order.Status,
			BillingCycle: order.BillingCycle,
			Provider:     order.Provider,
			CreatedAt:    order.CreatedAt.Format(time.RFC3339),
		}
		if order.PaidAt != nil {
			item.PaidAt = order.PaidAt.Format(time.RFC3339)
		}
		results = append(results, item)
	}

	response.Success(c, http.StatusOK, results)
}
