package dto

type CheckoutRequest struct {
	PlanCode     string `json:"planCode" binding:"required"`
	BillingCycle string `json:"billingCycle" binding:"required,oneof=monthly yearly"`
	Provider     string `json:"provider" binding:"required,oneof=mock stripe wechat alipay"`
}

type PayOrderRequest struct {
	Provider string `json:"provider" binding:"required"`
}

type PlanResponse struct {
	Code                  string `json:"code"`
	Name                  string `json:"name"`
	PriceMonthly          int64  `json:"priceMonthly"`
	PriceYearly           int64  `json:"priceYearly"`
	ResumeLimit           int    `json:"resumeLimit"`
	AIQuotaMonthly        int    `json:"aiQuotaMonthly"`
	TemplateLimit         int    `json:"templateLimit"`
	AllowDuplicate        bool   `json:"allowDuplicate"`
	AllowCustomSections   bool   `json:"allowCustomSections"`
	AllowCertifications   bool   `json:"allowCertifications"`
	AllowLanguages        bool   `json:"allowLanguages"`
	AllowAwards           bool   `json:"allowAwards"`
	AllowHdPdf            bool   `json:"allowHdPdf"`
	AllowJdOptimization   bool   `json:"allowJdOptimization"`
	AllowMultiLanguage    bool   `json:"allowMultiLanguage"`
	AllowPriorityFeatures bool   `json:"allowPriorityFeatures"`
}

type CheckoutResponse struct {
	OrderID       uint   `json:"orderId"`
	PlanCode      string `json:"planCode"`
	PlanName      string `json:"planName"`
	BillingCycle  string `json:"billingCycle"`
	Amount        int64  `json:"amount"`
	PaymentStatus string `json:"paymentStatus"`
	Provider      string `json:"provider"`
	CheckoutURL   string `json:"checkoutUrl,omitempty"`
	CodeURL       string `json:"codeUrl,omitempty"`
	FormHTML      string `json:"formHtml,omitempty"`
	SessionID     string `json:"sessionId,omitempty"`
}

type OrderResponse struct {
	ID           uint   `json:"id"`
	PlanCode     string `json:"planCode"`
	PlanName     string `json:"planName"`
	Amount       int64  `json:"amount"`
	Status       string `json:"status"`
	BillingCycle string `json:"billingCycle"`
	Provider     string `json:"provider"`
	CreatedAt    string `json:"createdAt"`
	PaidAt       string `json:"paidAt,omitempty"`
}
