Rails.application.routes.draw do
  # Auth: JSON only; JWT issued on sign-in/sign-up (see config/initializers/devise.rb).
  devise_for :users,
    defaults: { format: :json },
    controllers: {
      sessions: "users/sessions",
      registrations: "users/registrations"
    }

  get "me", to: "current_user#show"

  namespace :v1, defaults: { format: :json } do
    get "landing_sale", to: "landing_sales#show" # public
    get "shop_sale", to: "shop_sales#show" # public
    get "sale_pages/:id", to: "sale_pages#show" # public
    get "item_pages/:sale_id/:id", to: "item_pages#show" # public (visibility rules in Item#viewable_by?)
    get "nav_context", to: "nav_context#show"

    # Admin sale + nested items; member delete routes alias REST destroy for the SPA.
    resources :sales, only: %i[show create edit update destroy] do
      member do
        delete :delete, action: :destroy
      end

      resources :items, only: %i[show create edit update destroy] do
        member do
          delete :delete, action: :destroy
          post :duplicate
        end
      end
    end

    resources :orders, only: %i[index show new create edit update destroy] # current_user scoped

    resources :accounts, only: %i[index] # admin only (see AccountsController)
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
