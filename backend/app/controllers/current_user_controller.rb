# frozen_string_literal: true

# GET /me — lightweight session check for the SPA.
class CurrentUserController < ApplicationController
  before_action :authenticate_user!

  def show
    render json: {
      data: { id: current_user.id, email: current_user.email, role: current_user.role }
    }, status: :ok
  end
end
