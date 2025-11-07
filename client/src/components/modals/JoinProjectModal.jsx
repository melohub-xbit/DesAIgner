import { useState } from "react";
import toast from "react-hot-toast";
import { invitesAPI } from "../../utils/api";

const JoinProjectModal = ({ onClose, onJoined }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code) return toast.error("Enter a code");
    setLoading(true);
    try {
      const { data } = await invitesAPI.joinWithCode(code);
      toast.success(`Joined "${data.name}"`);
      onJoined();
      onClose();
    } catch {
      toast.error("Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-center">
        <h2 className="text-white text-xl mb-4">Join a Project</h2>
        <input
          type="text"
          placeholder="Enter invite code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full p-2 bg-gray-700 rounded text-white mb-4 text-center font-mono"
        />
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded py-2 text-white"
        >
          {loading ? "Joining..." : "Join Project"}
        </button>
        <button
          onClick={onClose}
          className="w-full mt-3 bg-gray-700 hover:bg-gray-600 rounded py-2 text-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default JoinProjectModal;
