import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { EmbeddingsModule } from "../embeddings/embeddings.module";
import { SegmentationModule } from "../segmentation/segmentation.module";
import { RetrievalService } from "./retrieval.service";

@Module({
  imports: [DatabaseModule, EmbeddingsModule, SegmentationModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
