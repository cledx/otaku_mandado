# frozen_string_literal: true

module Users
  # JSON sign-up and account update (password change). JWT on sign-up via devise-jwt.
  class RegistrationsController < Devise::RegistrationsController
    respond_to :json

    # POST /users — create account. Role stays client (User default); :role is not permitted.
    def create
      build_resource(sign_up_params)

      if resource.save
        sign_in(resource_name, resource)
        render json: { data: user_json(resource) }, status: :ok
      else
        render json: { errors: resource.errors.messages }, status: :unprocessable_entity
      end
    end

    # PATCH /users — change password (requires current_password). Any signed-in role.
    def update
      self.resource = current_user
      unless resource
        return render json: { error: "Not signed in" }, status: :unauthorized
      end

      if resource.update_with_password(account_update_params)
        # Keep the session; bypass_sign_in avoids requiring a fresh password check mid-request.
        bypass_sign_in(resource, scope: resource_name)
        render json: { data: user_json(resource) }, status: :ok
      else
        render json: { errors: resource.errors.messages }, status: :unprocessable_entity
      end
    end

    private

    def account_update_params
      params.require(:user).permit(:current_password, :password, :password_confirmation)
    end

    def user_json(user)
      { id: user.id, email: user.email, role: user.role }
    end
  end
end
