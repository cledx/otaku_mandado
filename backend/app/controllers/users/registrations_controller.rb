# frozen_string_literal: true

module Users
  # POST /users — sign up. Returns JWT in Authorization header (devise-jwt).
  class RegistrationsController < Devise::RegistrationsController
    respond_to :json

    def create
      # sign_up_params excludes :role; new users remain client (User default).
      build_resource(sign_up_params)

      if resource.save
        sign_in(resource_name, resource)
        render json: { data: user_json(resource) }, status: :ok
      else
        render json: { errors: resource.errors.messages }, status: :unprocessable_entity
      end
    end

    private

    def user_json(user)
      { id: user.id, email: user.email, role: user.role }
    end
  end
end
