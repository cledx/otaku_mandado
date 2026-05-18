# frozen_string_literal: true

module V1
  # Public read for a single sale drop page (products + countdown timing).
  # Used by #sale-{id} from the landing page; no JWT required.
  class SalePagesController < ApplicationController
    def show
      sale = Sale.kept.find(params[:id])
      render json: { data: sale_page_payload(sale) }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "not_found" }, status: :not_found
    end

    private

    # Matches landing_sale shape but includes nested items for the product grid.
    # Yen price is omitted here; only mx_price is public. Admins use GET /v1/sales/:id.
    def sale_page_payload(sale)
      sale.sale_page_data(include_price: false)
    end
  end
end
