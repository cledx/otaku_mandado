# frozen_string_literal: true

# Running total (MXN) of every order this user has paid for. Credited by
# Order#credit_user_total_spent the first time a line flips to
# "payment fulfilled". Backfill below seeds existing accounts using the
# current snapshot — any kept-or-discarded order currently at or past the
# payment-fulfilled step is treated as already paid.
class AddTotalSpentToUsers < ActiveRecord::Migration[8.1]
  PAID_STATUSES = [
    "payment fulfilled",
    "items purchased",
    "items sent",
    "items received"
  ].freeze

  def up
    add_column :users, :total_spent, :float, null: false, default: 0.0

    execute(<<~SQL)
      UPDATE users
      SET total_spent = COALESCE(sums.total, 0)
      FROM (
        SELECT orders.user_id AS user_id, SUM(COALESCE(items.mx_price, 0)) AS total
        FROM orders
        INNER JOIN items ON items.id = orders.item_id
        WHERE orders.status IN (#{PAID_STATUSES.map { |s| connection.quote(s) }.join(', ')})
        GROUP BY orders.user_id
      ) AS sums
      WHERE users.id = sums.user_id
    SQL
  end

  def down
    remove_column :users, :total_spent
  end
end
