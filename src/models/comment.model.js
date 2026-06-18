import moongoose ,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema(
  {
    content: {
      type: String,
      requird: true
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },{
    timestamps:true
  }
)

commentSchema.plugin(mongooseAggregatePaginate);

export const Commet = moongoose.model("Comment",commentSchema)