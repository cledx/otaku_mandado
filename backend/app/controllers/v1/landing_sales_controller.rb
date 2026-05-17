# frozen_string_literal: true

module V1
  # Public endpoint for the storefront countdown (no auth).
  class LandingSalesController < ApplicationController
    def show
      sale = Sale.next_for_landing
      render json: { data: sale ? landing_payload(sale) : nil }
    end

    private

    # Sale metadata only; items are loaded on the dedicated sale page endpoint.
    def landing_payload(sale)
      sale.timing_payload.merge(sale: sale.to_api_hash)
    end
  end
end
