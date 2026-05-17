# frozen_string_literal: true

module V1
  # Nested under /v1/sales/:sale_id/items. create runs AI metadata extraction from Cloudinary ids.
  class ItemsController < BaseController
    before_action :set_sale
    before_action :set_item, only: %i[show edit update destroy]

    def show
      render json: { data: @item.to_api_hash }
    end

    def edit
      render json: { data: @item.to_api_hash }
    end

    # POST body: { "public_ids": ["folder/asset", ...] } — Cloudinary public_ids only (no URLs).
    def create
      result = Ai::ProcessImageMetadataService.new(
        sale: @sale,
        metadata: public_ids_metadata
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

    def public_ids_metadata
      permitted = params.permit(public_ids: [])
      {
        public_ids: Array(permitted[:public_ids]).filter_map { |id| id.to_s.strip.presence }.uniq
      }
    end

  end
end
