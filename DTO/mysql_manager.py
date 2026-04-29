import mysql.connector
from mysql.connector import Error
from functools import wraps
import os

from dotenv import load_dotenv
load_dotenv()

database_host = os.getenv("DATA_BASE_HOST")
database_name = os.getenv("DATA_BASE_NAME")
database_user = os.getenv("DATA_BASE_USER")
database_pass = os.getenv("DATA_BASE_PASS")

# mysql server
def create_connection():
    try:
        connection = mysql.connector.connect(
            host=database_host,
            database=database_name,
            user=database_user,
            password=database_pass
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


def query_wrapper(func):
    @wraps(func)
    def with_query(*args, **kwargs):
        conn = create_connection()
        if conn is None:
            return None
        try:
            with conn.cursor() as cursor:
                result = func(cursor, *args, **kwargs) # run the actual database function
                conn.commit() # if it succeeds without errors, commit it here!
                return result
        except Error:
            if conn and conn.is_connected(): # if it fails, roll it back here
                conn.rollback()
            return None
        finally:
            if conn and conn.is_connected():
                conn.close()
    return with_query

def mysql_query(query, params=None, storage_change=False):
    conn = create_connection()
    if conn is None:
        return []

    result_list = []
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            if storage_change:
                conn.commit()
                return cursor.rowcount
            else:
                records = cursor.fetchall()
                result_list = [list(row) for row in records]

    except Error:
        if storage_change:
            conn.rollback() # if it fails, roll it back here

    finally:
        conn.close()

    return result_list

@query_wrapper
def reset_auto_increment(cursor, conn,
                         table_name, next_value=1):
    query = f"ALTER TABLE {table_name} AUTO_INCREMENT = %s"
    cursor.execute(query, (next_value,))
    conn.commit()
    print(f"Auto-increment for '{table_name}' reset to {next_value}.")
    return True