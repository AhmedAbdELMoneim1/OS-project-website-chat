from DTO.mysql_manager import query_wrapper, mysql_query

check_user_query = """
SELECT user_id 
FROM users_login_inf
WHERE email = (%s) AND password_hash = (%s);
"""
check_user_pass_query = """
SELECT user_id 
From users_login_inf 
WHERE email = (%s) AND password_hash = (%s);
"""

create_user_inf_query = """
INSERT INTO users_inf (first_name, last_name)
VALUES (%s, %s);
"""
create_user_login_inf_query = """
INSERT INTO users_login_inf (user_id, email, password_hash) 
VALUES (%s, %s, %s);
"""


def check_user(email: str):
    user = mysql_query(check_user_query, (email, ))
    return True if user else False

def check_user_pass(email: str, password_hash: str):
    user = mysql_query(create_user_login_inf_query, (email, password_hash))
    return True if user else False

@query_wrapper
def create_user(cursor, first_name: str, last_name: str, email: str, password_hash: str):
    cursor.execute(create_user_inf_query, (first_name, last_name))
    user_id = cursor.lastrowid
    if not user_id:
        raise user_id("user not created for a reason")
    cursor.execute(create_user_login_inf_query, (user_id, email, password_hash))
    return user_id
