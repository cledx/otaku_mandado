# frozen_string_literal: true

module V1
  # Admin CRUD for promotional coupon codes (Coupon Codes admin tool).
  class CouponCodesController < BaseController
    before_action :require_admin!
    before_action :set_coupon_code, only: %i[update destroy]

    def index
      coupons = CouponCode.kept.order(created_at: :desc)
      render json: { data: coupons.map(&:to_api_hash) }
    end

    def create
      coupon = CouponCode.new(coupon_code_params)
      if coupon.save
        render json: { data: coupon.to_api_hash }, status: :created
      else
        render json: { errors: coupon.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @coupon_code.update(coupon_code_params)
        render json: { data: @coupon_code.to_api_hash }
      else
        render json: { errors: @coupon_code.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @coupon_code.soft_discard!
      render json: { data: @coupon_code.reload.to_api_hash }
    end

    private

    def set_coupon_code
      @coupon_code = CouponCode.kept.find(params[:id])
    end

    def coupon_code_params
      params.require(:coupon_code).permit(:code, :discount, :expiry)
    end

    def require_admin!
      return if current_user&.role == "admin"

      render json: { error: "forbidden" }, status: :forbidden
    end
  end
end
