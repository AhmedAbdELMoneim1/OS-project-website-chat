from DTO.mysql_manager import query_wrapper
from typing import Literal

update_user_inf_query = """
UPDATE users_inf 
SET first_name = %s,
    last_name = %s
WHERE user_id = %s;
"""

update_user_pass_query = """
update users_login_inf 
set password_hash = %s
where user_id = %s;
"""

update_user_status_query = """
UPDATE users_status 
SET state = %s
WHERE user_id = %s; 
"""

@query_wrapper
def change_user_inf(cursor, user_id: int, firstname: str, lastname: str):
    cursor.execute(update_user_inf_query, (firstname, lastname, user_id))
    return True

@query_wrapper
def change_user_pass(cursor, user_id: int, password_hash: str):
    cursor.execute(update_user_pass_query, (password_hash, user_id))
    return True

@query_wrapper
def change_user_status(cursor, user_id: int, status: Literal['online', 'offline']):
    cursor.execute(update_user_status_query, (status, user_id))
    return True
