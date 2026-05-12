# frozen_string_literal: true

module V1
  class BaseController < ApplicationController
    before_action :authenticate_user!

    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

    private

    def render_not_found
      render json: { error: "not_found" }, status: :not_found
    end
  end
end
