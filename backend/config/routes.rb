Rails.application.routes.draw do
  devise_for :users, defaults: { format: :json }

  get "me", to: "current_user#show"

  namespace :v1, defaults: { format: :json } do
    resources :sales, only: %i[show create edit update destroy] do
      member do
        delete :delete, action: :destroy
      end

      resources :items, only: %i[show create edit update destroy] do
        member do
          delete :delete, action: :destroy
        end
      end
    end

    resources :orders, only: %i[index show new create edit update destroy]
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
