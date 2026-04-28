import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "tool"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    toolName: {
      type: String,
      default: "",
    },
  },
  { _id: false, timestamps: true },
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    pageContext: {
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "job",
        default: null,
      },
      category: {
        type: String,
        default: "",
      },
      jobTitle: {
        type: String,
        default: "",
      },
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("AIConversation", aiConversationSchema);
