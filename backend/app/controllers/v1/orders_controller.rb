# frozen_string_literal: true

module V1
  # Clients see/modify only their own orders; admins act on every user's orders
  # (View Orders page can advance fulfillment status).
  class OrdersController < BaseController
    before_action :set_order, only: %i[show edit update destroy]

    # Admins see every user's orders (View Orders page); clients see only their own.
    def index
      include_user = current_user.role == "admin"
      scope =
        if include_user
          Order.kept.includes(:item, :user, :coupon_code).order(created_at: :desc)
        else
          current_user.orders.kept.includes(:item, :coupon_code).order(created_at: :desc)
        end

      render json: {
        data: scope.map { |o| o.to_api_hash(include_item: true, include_user: include_user) }
      }
    end

    def show
      render json: { data: @order.to_api_hash(include_item: true) }
    end

    def new
      order = Order.new(user: current_user, status: "pending")
      render json: { data: order.to_api_hash(include_item: false) }
    end

    def edit
      render json: { data: @order.to_api_hash(include_item: true) }
    end

    def create
      attrs = order_create_params
      Item.kept.find(attrs[:item_id])
      @order = current_user.orders.build(attrs)
      if @order.save
        render json: { data: @order.to_api_hash(include_item: true) }, status: :created
      else
        render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @order.update(order_update_params)
        include_user = current_user.role == "admin"
        render json: { data: @order.to_api_hash(include_item: true, include_user: include_user) }
      else
        render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @order.soft_discard!
      render json: { data: @order.reload.to_api_hash(include_item: true) }
    end

    # Client-only: attach a coupon to every kept line for the given order_number.
    # Rejects if a coupon is already present, the code is unknown, or it has expired.
    def apply_coupon
      if current_user.role == "admin"
        return render json: { error: "forbidden" }, status: :forbidden
      end

      order_number = params[:order_number].to_s.strip
      code = params[:code].to_s.strip.upcase
      if order_number.blank? || code.blank?
        return render json: { errors: ["Order number and coupon code are required"] },
                      status: :unprocessable_entity
      end

      lines = current_user.orders.kept.where(order_number: order_number).includes(:coupon_code, :item)
      if lines.empty?
        return render json: { error: "not_found" }, status: :not_found
      end

      if lines.any? { |line| line.coupon_code_id.present? }
        return render json: { errors: ["A coupon code has already been applied to this order"] },
                      status: :unprocessable_entity
      end

      coupon = CouponCode.kept.find_by(code: code)
      unless coupon
        return render json: { errors: ["Invalid coupon code"] }, status: :unprocessable_entity
      end

      if coupon.expiry.present? && coupon.expiry < Time.current
        return render json: { errors: ["This coupon code has expired"] }, status: :unprocessable_entity
      end

      Order.transaction do
        lines.find_each { |line| line.update!(coupon_code: coupon) }
      end

      updated = current_user.orders.kept
                            .where(order_number: order_number)
                            .includes(:item, :coupon_code)
                            .order(created_at: :desc)

      render json: {
        data: updated.map { |o| o.to_api_hash(include_item: true) }
      }
    end

    private

    def set_order
      scope = current_user.role == "admin" ? Order.kept : current_user.orders.kept
      @order = scope.includes(:coupon_code).find(params[:id])
    end

    def order_create_params
      params.require(:order).permit(:item_id)
    end

    def order_update_params
      params.require(:order).permit(:status)
    end
  end
end
