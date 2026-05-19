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
          Order.kept.includes(:item, :user).order(created_at: :desc)
        else
          current_user.orders.kept.includes(:item).order(created_at: :desc)
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

    private

    def set_order
      scope = current_user.role == "admin" ? Order.kept : current_user.orders.kept
      @order = scope.find(params[:id])
    end

    def order_create_params
      params.require(:order).permit(:item_id)
    end

    def order_update_params
      params.require(:order).permit(:status)
    end
  end
end
