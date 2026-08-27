# frozen_string_literal: true

module V1
  # Admin-only account directory and provisioning.
  # Index powers View Accounts; create powers the Create New User admin tool.
  class AccountsController < BaseController
    before_action :require_admin!

    DEFAULT_PASSWORD = "password"

    def index
      pending_user_ids = Order.kept.where(status: "pending").distinct.pluck(:user_id).to_set
      # Count distinct order_numbers, not Order rows: a single pending checkout
      # groups multiple line items under one shared order_number, so grouping by
      # user alone would overcount (3-item cart would read as "3 pending orders").
      pending_counts = Order.kept.where(status: "pending").group(:user_id).distinct.count(:order_number)

      accounts = User.order(:email).map do |user|
        {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          pending_orders: pending_user_ids.include?(user.id),
          pending_orders_count: pending_counts[user.id] || 0,
          total_spent: user.total_spent.to_f
        }
      end

      render json: { data: accounts }
    end

    def create
      user = User.new(account_create_params)
      user.password = DEFAULT_PASSWORD
      user.password_confirmation = DEFAULT_PASSWORD

      if user.save
        render json: {
          data: {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at
          }
        }, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def account_create_params
      params.require(:account).permit(:email, :role)
    end

    def require_admin!
      return if current_user&.role == "admin"

      render json: { error: "forbidden" }, status: :forbidden
    end
  end
end
