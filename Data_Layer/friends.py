from DTO.mysql_manager import query_wrapper, mysql_query, Error

user_chats_query = """
SELECT 
    cp1.chat_id, 
    u1.user_id AS friend_id, 
    u1.first_name, 
    u1.last_name
FROM chat_participants cp1
INNER JOIN chat_participants cp2 
    ON cp1.chat_id = cp2.chat_id AND cp1.user_id != cp2.user_id
INNER JOIN users_inf u1 
    ON u1.user_id = cp2.user_id
WHERE cp1.user_id = %s;
"""

create_chats_query = """
insert into chats VALUES ();
"""

create_chat_participant_query = mysql_query("""
insert into chat_participants (chat_id, user_id) 
    VALUES (%s, %s);
""")

def load_user_chats(user_id: int):
    """
    :param user_id:
    :return:
    {
        chat_id: {friend_id: 1, first_name: patates, last_name: patates},
    }
    """
    chats = mysql_query(user_chats_query, (user_id,))

    if not chats:
        return {}

    return {
        chat[0]: {
            "friend_id": chat[1],
            "first_name": chat[2],
            "last_name": chat[3]
        } for chat in chats}

@query_wrapper
def create_two_users_chat(cursor, user_id1, user_id2) -> int:
    cursor.execute(create_chats_query)

    chat_id = cursor.lastrowid

    if not chat_id:
        raise Error("chat not created for a reason")

    cursor.execute(create_chat_participant_query, (chat_id, user_id1))
    cursor.execute(create_chat_participant_query, (chat_id, user_id2))

    return chat_id

