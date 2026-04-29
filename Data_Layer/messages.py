from DTO.mysql_manager import query_wrapper, mysql_query

send_message_query = """
INSERT INTO chats_messages (chat_id, from_user_id, message_text)
VALUES (%s, %s, %s);
"""

load_100_msg_query = """
Select from_user_id, message_text, created_at
FROM chats_messages
WHERE chat_id = %s AND created_at < %s 
LIMIT 100;
"""

@query_wrapper
def send_message(cursor, chat_id: int, from_user_id: int, message_text: str):
    cursor.execute(send_message_query, (chat_id, from_user_id, message_text))
    return True

def load_chat_messages(chat_id: int, from_datetime: str):
    """
    :param chat_id:
    :param from_datetime:
    :return ex:
        [
            [from_user_id, message_text, created_at],
            ...
        ]
    """
    messages = mysql_query(load_100_msg_query, (chat_id, from_datetime))

    if not messages:
        return []

    return messages
