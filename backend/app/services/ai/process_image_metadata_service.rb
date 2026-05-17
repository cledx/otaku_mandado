# frozen_string_literal: true

module Ai
  # Creates items from Cloudinary public_ids, then fills name/brand/description via RubyLLM vision.
  # metadata: { public_ids: ["cloudinary/public_id", ...] } (symbol or string keys from JSON)
  class ProcessImageMetadataService

    class ItemSchema < RubyLLM::Schema 
      integer :id, description: "The id of the item"
      string :name, description: "The name of the item or N/A if not found"
      string :brand, description: "The brand of the item or N/A if not found"
      string :description, description: "The description of the item in Spanish or N/A if not found"
      boolean :error, description: "Whether there was an error processing the image or false if no error"
      string :error_message, description: "The error message if there was an error processing the image or N/A if no error"
    end

    Result = Struct.new(:items, :errors, keyword_init: true) do
      def success?
        errors.blank?
      end
    end

    def initialize(sale:, metadata:)
      @sale = sale
      @metadata = coerce_metadata(metadata)
      @chat = RubyLLM.chat.with_schema(ItemSchema)
    end

    def call
      items = []
      errors = []

      # Persist placeholder rows first so we have ids before the LLM pass.
      metadata[:public_ids].each do |public_id|
        item = Item.new(
          sale: @sale,
          name: "",
          brand: "",
          description: "",
          status: "available",
          image: [public_id]
        )
        if item.save
          items << item
        else
          errors << { public_id: public_id, errors: "Item was unable to be saved" }
        end
      end

      items.each do |item|
        cloudinary_url = Cloudinary::Utils.cloudinary_url(item.image.first)
        response = @chat.ask("Analize the image and return the information in the schema", with: cloudinary_url)
        item.name = response.name
        item.brand = response.brand
        item.description = response.description
        error = response.error
        error_message = response.error_message
        item.save
        if error
          errors << { item_id: item.id, errors: error_message }
        end
      end

      return Result.new(items: items, errors: errors)
    end

    private

    attr_reader :sale, :metadata

    def coerce_metadata(raw)
      return { public_ids: [] } if raw.blank?

      h = raw.to_h.symbolize_keys
      ids = Array(h[:public_ids]).filter_map { |id| id.to_s.strip.presence }.uniq
      { public_ids: ids }
    end
  end
end
