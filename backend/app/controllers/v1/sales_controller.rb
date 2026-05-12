# frozen_string_literal: true

module V1
  class SalesController < BaseController
    before_action :set_sale, only: %i[show edit update destroy]

    def show
      render json: { data: @sale.to_api_hash(include_items: true) }
    end

    def edit
      render json: { data: @sale.to_api_hash(include_items: true) }
    end

    def create
      @sale = Sale.new(sale_params)
      if @sale.save
        render json: { data: @sale.to_api_hash(include_items: true) }, status: :created
      else
        render json: { errors: @sale.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @sale.update(sale_params)
        render json: { data: @sale.to_api_hash(include_items: true) }
      else
        render json: { errors: @sale.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @sale.soft_discard!
      render json: { data: @sale.reload.to_api_hash(include_items: true) }
    end

    private

    def set_sale
      @sale = Sale.kept.find(params[:id])
    end

    def sale_params
      params.require(:sale).permit(:start_time, :duration, :name)
    end
  end
end
