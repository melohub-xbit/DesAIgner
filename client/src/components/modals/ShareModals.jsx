import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { invitesAPI } from "../../utils/api";

const ShareModal = ({ projectId, onClose }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCode = async () => {
      try {
        const { data } = await invitesAPI.generateCode(projectId);
        setCode(data.code);
        toast.success("Code generated!");
      } catch {
        toast.error("Failed to generate code");
      } finally {
        setLoading(false);
      }
    };
    getCode();
  }, [projectId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-center">
        <h2 className="text-white text-xl mb-4">Project Invite Code</h2>

        {loading ? (
          <p className="text-gray-400">Generating code...</p>
        ) : (
          <>
            <p className="text-gray-400 mb-2">Share this code:</p>
            <div className="flex justify-center items-center gap-3 mb-4">
              <span className="bg-gray-700 px-4 py-2 rounded text-white font-mono text-lg tracking-wider">
                {code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success("Copied!");
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
              >
                Copy
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 rounded py-2 text-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
