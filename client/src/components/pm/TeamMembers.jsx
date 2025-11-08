import { motion } from "framer-motion";
import { User, Crown, Shield } from "lucide-react";

const TeamMembers = ({ team }) => {
  if (!team) return null;

  const members = [
    {
      user: team.owner,
      role: "owner",
    },
    ...(team.members || []),
  ];

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case "admin":
        return <Shield className="w-4 h-4 text-purple-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      default:
        return "Member";
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
      <div className="space-y-3">
        {members.map((member, index) => (
          <motion.div
            key={member.user._id || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold">
              {member.user.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{member.user.username}</p>
              <p className="text-xs text-gray-400">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {getRoleIcon(member.role)}
              <span className="text-gray-400">{getRoleLabel(member.role)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;

