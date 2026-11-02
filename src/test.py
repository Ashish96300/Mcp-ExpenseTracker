
# from DB.get_db import get_db
# from DB.models import Expense
# from fastmcp import FastMCP

# mcp = FastMCP(name="Expense-Tracker")

# @mcp.tool()
# def add_expenses(amount: float, description: str, date: str, category: str) -> dict:
#     db = get_db()
#     try:
#         new_expense = Expense(
#             amount=amount,
#             description=description,
#             date=date,
#             category=category
#         )
#         db.add(new_expense)
#         db.commit()
#         db.refresh(new_expense)
#         return {"id": new_expense.id, "message": "Expense added successfully"}
#     finally:
#         db.close()

# @mcp.tool()
# def get_expenses() -> list:
#     db = get_db()
#     try:
#         expenses = db.query(Expense).all()
#         return [
#             {
#                 "id": exp.id,
#                 "amount": exp.amount,
#                 "description": exp.description,
#                 "date": str(exp.date),
#                 "category": exp.category
#             }
#             for exp in expenses
#         ]
#     finally:
#         db.close()

# @mcp.tool()
# def update_expense(amount: float, description: str, date: str, category: str, id: int) -> dict:
#     db = get_db()
#     try:
#         expense = db.query(Expense).filter(Expense.id == id).first()
#         if not expense:
#             return {"message": "Expense not found"}

#         # Update fields
#         expense.amount = amount
#         expense.description = description
#         expense.date = date
#         expense.category = category

#         db.commit()
#         db.refresh(expense)
#         return {
#             "message": "Expense updated successfully",
#             "updated_expense": {
#                 "id": expense.id,
#                 "amount": expense.amount,
#                 "description": expense.description,
#                 "date": str(expense.date),
#                 "category": expense.category
#             }
#         }
#     finally:
#         db.close()

# # ------------------ DELETE ------------------
# @mcp.tool()
# def delete_expense(id: int) -> dict:
#     db = get_db()
#     try:
#         expense = db.query(Expense).filter(Expense.id == id).first()
#         if not expense:
#             return {"message": "Expense not found"}
        
#         db.delete(expense)
#         db.commit()
#         return {"message": f"Expense with ID {id} deleted successfully"}
#     finally:
#         db.close()


# if __name__ == "__main__":
#     mcp.run()
