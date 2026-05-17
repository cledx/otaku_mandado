# frozen_string_literal: true

module Users
  class SessionsController < Devise::SessionsController
    respond_to :json

    def create
      self.resource = warden.authenticate(auth_options)

      if resource
        sign_in(resource_name, resource)
        render json: { data: user_json(resource) }, status: :ok
      else
        render json: { error: I18n.t("devise.failure.invalid", authentication_keys: "Email") }, status: :unauthorized
      end
    end

    def destroy
      if current_user
        sign_out(current_user)
        render json: { data: { message: "Signed out" } }, status: :ok
      else
        render json: { error: "Not signed in" }, status: :unauthorized
      end
    end

    private

    def user_json(user)
      { id: user.id, email: user.email }
    end
  end
end
