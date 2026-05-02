from flask import Blueprint, jsonify, request, session
from flask_socketio import emit, join_room, leave_room
from extensions import socketio, active_streams

live_bp = Blueprint("live", __name__)


@live_bp.route("/api/live/streams", methods=["GET"])
def get_active_streams():
    streams = [
        {
            "username": username,
            "avatar_url": info.get("avatar_url"),
            "started_at": info.get("started_at"),
            "viewer_count": info.get("viewer_count", 0),
            "title": info.get("title", "Live Stream"),
        }
        for username, info in active_streams.items()
    ]
    return jsonify({"streams": streams}), 200


@socketio.on("go_live")
def handle_go_live(data):
    username = data.get("username")
    if not username:
        return
    active_streams[username] = {
        "socket_id": request.sid,
        "username": username,
        "avatar_url": data.get("avatar_url", ""),
        "title": data.get("title", "Live Stream"),
        "viewers": [],
        "viewer_count": 0,
        "started_at": data.get("started_at", ""),
    }
    join_room(f"live_{username}")
    emit("live_started", {"username": username, "title": data.get("title", "Live Stream")}, broadcast=True)


@socketio.on("watch_live")
def handle_watch_live(data):
    username = data.get("broadcaster")
    if username not in active_streams:
        emit("error", {"message": "Stream not found or ended"})
        return
    stream = active_streams[username]
    join_room(f"live_{username}")
    if request.sid not in stream["viewers"]:
        stream["viewers"].append(request.sid)
    stream["viewer_count"] = len(stream["viewers"])
    emit("viewer_joined", {"viewer_sid": request.sid}, room=stream["socket_id"])
    emit("viewer_count", {"count": stream["viewer_count"]}, room=f"live_{username}")


@socketio.on("leave_live")
def handle_leave_live(data):
    username = data.get("broadcaster")
    if username in active_streams:
        stream = active_streams[username]
        if request.sid in stream["viewers"]:
            stream["viewers"].remove(request.sid)
        stream["viewer_count"] = len(stream["viewers"])
        emit("viewer_count", {"count": stream["viewer_count"]}, room=f"live_{username}")
    leave_room(f"live_{username}")


@socketio.on("offer")
def handle_offer(data):
    emit("offer", {"offer": data["offer"], "broadcaster": data["broadcaster"]}, room=data["viewer_sid"])


@socketio.on("answer")
def handle_answer(data):
    broadcaster = data.get("broadcaster")
    if broadcaster in active_streams:
        broadcaster_sid = active_streams[broadcaster]["socket_id"]
        emit("answer", {"answer": data["answer"], "viewer_sid": request.sid}, room=broadcaster_sid)


@socketio.on("ice_candidate")
def handle_ice_candidate(data):
    emit("ice_candidate", {"candidate": data["candidate"], "from": request.sid}, room=data["to"])


@socketio.on("end_live")
def handle_end_live(data):
    username = data.get("username")
    if username in active_streams:
        emit("live_ended", {"username": username}, room=f"live_{username}")
        del active_streams[username]
    emit("stream_list_updated", broadcast=True)


@socketio.on("disconnect")
def handle_disconnect():
    for username, stream in list(active_streams.items()):
        if stream["socket_id"] == request.sid:
            emit("live_ended", {"username": username}, room=f"live_{username}")
            del active_streams[username]
            emit("stream_list_updated", broadcast=True)
            break
        if request.sid in stream.get("viewers", []):
            stream["viewers"].remove(request.sid)
            stream["viewer_count"] = len(stream["viewers"])
            emit("viewer_count", {"count": stream["viewer_count"]}, room=f"live_{username}")
