# frozen_string_literal: true

module V1
  # Admin-only directory of every registered account, annotated with whether the
  # user currently has any pending (kept) orders. Powers the View Accounts page.
  class AccountsController < BaseController
    before_action :require_admin!

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

    private

    def require_admin!
      return if current_user&.role == "admin"

      render json: { error: "forbidden" }, status: :forbidden
    end
  end
end
