# frozen_string_literal: true

module V1
  class ItemsController < BaseController
    before_action :set_sale
    before_action :set_item, only: %i[show edit update destroy]

    def show
      render json: { data: @item.to_api_hash }
    end

    def edit
      render json: { data: @item.to_api_hash }
    end

    def create
      result = Ai::ProcessImageMetadataService.new(
        sale: @sale,
        metadata: params.dig(:item, :image)
      ).call

      if result.success?
        render json: { data: result.items.map(&:to_api_hash) }, status: :created
      else
        render json: { errors: result.errors }, status: :unprocessable_entity
      end
    end

    def update
      if @item.update(item_params)
        render json: { data: @item.to_api_hash }
      else
        render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @item.soft_discard!
      render json: { data: @item.reload.to_api_hash }
    end

    private

    def set_sale
      @sale = Sale.kept.find(params[:sale_id])
    end

    def set_item
      @item = @sale.items.kept.find(params[:id])
    end

  end
end
