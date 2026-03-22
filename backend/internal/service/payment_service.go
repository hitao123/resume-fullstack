package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/stripe/stripe-go/v83"
	"github.com/stripe/stripe-go/v83/checkout/session"
)

const (
	PaymentProviderMock   = "mock"
	PaymentProviderStripe = "stripe"
	PaymentProviderWeChat = "wechat"
	PaymentProviderAlipay = "alipay"
)

type PaymentIntent struct {
	Provider    string `json:"provider"`
	OrderID     uint   `json:"orderId"`
	CheckoutURL string `json:"checkoutUrl,omitempty"`
	CodeURL     string `json:"codeUrl,omitempty"`
	FormHTML    string `json:"formHtml,omitempty"`
	SessionID   string `json:"sessionId,omitempty"`
}

type PaymentService struct{}

func NewPaymentService() *PaymentService {
	return &PaymentService{}
}

func (s *PaymentService) CreatePaymentIntent(ctx context.Context, order models.PaymentOrder, plan models.Plan, provider string) (*PaymentIntent, error) {
	switch provider {
	case PaymentProviderMock:
		return &PaymentIntent{
			Provider:    provider,
			OrderID:     order.ID,
			CheckoutURL: fmt.Sprintf("/pricing?mockPayOrder=%d", order.ID),
		}, nil
	case PaymentProviderStripe:
		return s.createStripeCheckout(ctx, order, plan)
	case PaymentProviderWeChat:
		return s.createWeChatNative(ctx, order, plan)
	case PaymentProviderAlipay:
		return s.createAlipayPage(ctx, order, plan)
	default:
		return nil, &LimitError{
			Code:    "PAYMENT_PROVIDER_NOT_SUPPORTED",
			Message: "Unsupported payment provider",
			Details: map[string]interface{}{"provider": provider},
		}
	}
}

func (s *PaymentService) createStripeCheckout(_ context.Context, order models.PaymentOrder, plan models.Plan) (*PaymentIntent, error) {
	secretKey := os.Getenv("STRIPE_SECRET_KEY")
	successURL := os.Getenv("STRIPE_SUCCESS_URL")
	cancelURL := os.Getenv("STRIPE_CANCEL_URL")
	if secretKey == "" || successURL == "" || cancelURL == "" {
		return nil, &LimitError{
			Code:    "PAYMENT_PROVIDER_NOT_CONFIGURED",
			Message: "Stripe payment is not configured yet",
			Details: map[string]interface{}{"provider": PaymentProviderStripe},
		}
	}

	stripe.Key = secretKey
	params := &stripe.CheckoutSessionParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(successURL + fmt.Sprintf("?order_id=%d", order.ID)),
		CancelURL:  stripe.String(cancelURL),
		Metadata: map[string]string{
			"order_id":   fmt.Sprintf("%d", order.ID),
			"plan_code":  plan.Code,
			"user_id":    fmt.Sprintf("%d", order.UserID),
			"provider":   PaymentProviderStripe,
			"order_type": "subscription_upgrade",
		},
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Quantity: stripe.Int64(1),
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency:   stripe.String("cny"),
					UnitAmount: stripe.Int64(order.Amount),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name:        stripe.String(plan.Name),
						Description: stripe.String(fmt.Sprintf("%s plan upgrade", plan.Code)),
					},
				},
			},
		},
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, err
	}

	return &PaymentIntent{
		Provider:    PaymentProviderStripe,
		OrderID:     order.ID,
		CheckoutURL: sess.URL,
		SessionID:   sess.ID,
	}, nil
}

func (s *PaymentService) createWeChatNative(_ context.Context, order models.PaymentOrder, plan models.Plan) (*PaymentIntent, error) {
	mchid := os.Getenv("WECHAT_PAY_MCH_ID")
	serialNo := os.Getenv("WECHAT_PAY_SERIAL_NO")
	privateKey := os.Getenv("WECHAT_PAY_PRIVATE_KEY")
	apiV3Key := os.Getenv("WECHAT_PAY_API_V3_KEY")
	notifyURL := os.Getenv("WECHAT_PAY_NOTIFY_URL")
	appURL := os.Getenv("APP_BASE_URL")
	if mchid == "" || serialNo == "" || privateKey == "" || apiV3Key == "" || notifyURL == "" || appURL == "" {
		return nil, &LimitError{
			Code:    "PAYMENT_PROVIDER_NOT_CONFIGURED",
			Message: "WeChat Pay Native is not configured yet",
			Details: map[string]interface{}{"provider": PaymentProviderWeChat},
		}
	}

	// We keep the official API request shape here so adding signing later is isolated.
	payload := map[string]any{
		"appid":        os.Getenv("WECHAT_PAY_APP_ID"),
		"mchid":        mchid,
		"description":  plan.Name,
		"out_trade_no": fmt.Sprintf("resume-%d", order.ID),
		"notify_url":   notifyURL,
		"amount": map[string]any{
			"total":    order.Amount,
			"currency": "CNY",
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "https://api.mch.weixin.qq.com/v3/pay/transactions/native", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("WECHATPAY2-SHA256-RSA2048 mchid=\"%s\",serial_no=\"%s\",signature=\"pending\",timestamp=\"0\",nonce_str=\"pending\"", mchid, serialNo))

	return &PaymentIntent{
		Provider: PaymentProviderWeChat,
		OrderID:  order.ID,
		CodeURL:  fmt.Sprintf("%s/api/v1/billing/orders/%d/pay?provider=wechat", strings.TrimRight(appURL, "/"), order.ID),
	}, nil
}

func (s *PaymentService) createAlipayPage(_ context.Context, order models.PaymentOrder, plan models.Plan) (*PaymentIntent, error) {
	appID := os.Getenv("ALIPAY_APP_ID")
	privateKey := os.Getenv("ALIPAY_PRIVATE_KEY")
	publicKey := os.Getenv("ALIPAY_PUBLIC_KEY")
	returnURL := os.Getenv("ALIPAY_RETURN_URL")
	notifyURL := os.Getenv("ALIPAY_NOTIFY_URL")
	if appID == "" || privateKey == "" || publicKey == "" || returnURL == "" || notifyURL == "" {
		return nil, &LimitError{
			Code:    "PAYMENT_PROVIDER_NOT_CONFIGURED",
			Message: "Alipay Page Pay is not configured yet",
			Details: map[string]interface{}{"provider": PaymentProviderAlipay},
		}
	}

	formHTML := fmt.Sprintf(
		`<form id="alipay-form" action="https://openapi.alipay.com/gateway.do" method="POST">
<input type="hidden" name="app_id" value="%s" />
<input type="hidden" name="method" value="alipay.trade.page.pay" />
<input type="hidden" name="charset" value="utf-8" />
<input type="hidden" name="sign_type" value="RSA2" />
<input type="hidden" name="return_url" value="%s" />
<input type="hidden" name="notify_url" value="%s" />
<input type="hidden" name="biz_content" value='{"out_trade_no":"resume-%d","total_amount":"%.2f","subject":"%s","product_code":"FAST_INSTANT_TRADE_PAY"}' />
</form><script>document.getElementById("alipay-form").submit();</script>`,
		appID, returnURL, notifyURL, order.ID, float64(order.Amount)/100, plan.Name,
	)

	return &PaymentIntent{
		Provider: PaymentProviderAlipay,
		OrderID:  order.ID,
		FormHTML: formHTML,
	}, nil
}
