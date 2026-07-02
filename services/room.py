from database.models import Room

def room_exist(room_id: int, db):
    return db.query(Room).filter_by(id=room_id).first()
