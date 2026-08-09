# frozen_string_literal: true

module V1
  # Nested under /v1/sales/:sale_id/items. create runs AI metadata extraction from Cloudinary ids.
  class ItemsController < BaseController
    before_action :set_sale
    before_action :set_item, only: %i[show edit update destroy duplicate move_to_shop]

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

      if result.items.empty?
        render json: { errors: result.errors }, status: :unprocessable_entity
        return
      end

      payload = { data: result.items.map(&:to_api_hash) }
      payload[:errors] = result.errors if result.errors.present?
      render json: payload, status: :created
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

    # POST — clone listing fields; new item is always status "available".
    def duplicate
      copy = @item.duplicate_as_available!
      render json: { data: copy.to_api_hash }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    # POST — reassign item from a drop sale onto the permanent Shop catalog.
    def move_to_shop
      @item.move_to_shop!
      render json: { data: @item.to_api_hash }
    rescue Item::AlreadyInShopError => e
      render json: { errors: [e.message] }, status: :unprocessable_entity
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    rescue ActiveRecord::RecordNotFound
      render json: { errors: ["Shop catalog not found"] }, status: :unprocessable_entity
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

    def item_params
      params.require(:item).permit(
        :name,
        :brand,
        :description,
        :price,
        :status,
        image: []
      )
    end
  end
end
