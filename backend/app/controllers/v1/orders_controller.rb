# frozen_string_literal: true

module V1
  # Current user's orders only (scoped in set_order and index).
  class OrdersController < BaseController
    before_action :set_order, only: %i[show edit update destroy]

    def index
      @orders = current_user.orders.kept.includes(:item).order(created_at: :desc)
      render json: { data: @orders.map { |o| o.to_api_hash(include_item: true) } }
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
        render json: { data: @order.to_api_hash(include_item: true) }
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
      @order = current_user.orders.kept.find(params[:id])
    end

    def order_create_params
      params.require(:order).permit(:item_id)
    end

    def order_update_params
      params.require(:order).permit(:status)
    end
  end
end
