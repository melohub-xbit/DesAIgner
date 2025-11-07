import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { invitesAPI } from "../utils/api";
import toast from "react-hot-toast";

const AcceptInvite = () => {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const { data } = await invitesAPI.preview(token);
        setInvite(data.invite);
      } catch {
        toast.error("Invite is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };
    loadInvite();
  }, [token]);

  const handleAccept = async () => {
    try {
      await invitesAPI.accept(token);
      toast.success("You’ve joined the project!");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to accept invite.");
    }
  };

  const handleDecline = async () => {
    try {
      await invitesAPI.decline(token);
      toast.success("Invite declined.");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to decline invite.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading invite...
      </div>
    );

  if (!invite)
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        Invalid or expired invite
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center text-white bg-gray-900">
      <h2 className="text-2xl mb-4">
        You’ve been invited to collaborate on <span className="text-blue-400">{invite.project.name}</span>
      </h2>
      <p className="mb-6 text-gray-400">Role: {invite.role}</p>
      <div className="flex gap-4">
        <button
          onClick={handleAccept}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Accept
        </button>
        <button
          onClick={handleDecline}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default AcceptInvite;
