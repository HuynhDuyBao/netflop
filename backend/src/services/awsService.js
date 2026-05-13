import { MediaConvertClient, CreateJobCommand, GetJobCommand } from "@aws-sdk/client-mediaconvert";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";

const s3 = new S3Client({ region: env.aws.region });

function requireAwsConfig() {
  const missing = [];
  if (!env.aws.inputBucket) missing.push("AWS_S3_INPUT_BUCKET");
  if (!env.aws.outputBucket) missing.push("AWS_S3_OUTPUT_BUCKET");
  if (!env.aws.mediaConvertEndpoint) missing.push("AWS_MEDIACONVERT_ENDPOINT");
  if (!env.aws.mediaConvertRoleArn) missing.push("AWS_MEDIACONVERT_ROLE_ARN");
  if (missing.length) {
    const error = new Error(`Thiếu cấu hình AWS: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

export function buildInputKey({ movieId, episodeId, filename }) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `uploads/movies/${movieId}/episodes/${episodeId}/${Date.now()}-${nanoid(8)}-${safeName}`;
}

export function buildOutputPrefix({ movieId, episodeId }) {
  return `movies/${movieId}/episodes/${episodeId}/`;
}

export function buildCloudFrontUrl(key) {
  return env.aws.cloudFrontDomain ? `${env.aws.cloudFrontDomain}/${key}` : "";
}

export async function createUploadUrl({ key, contentType = "video/mp4" }) {
  if (!env.aws.inputBucket) {
    const error = new Error("Thiếu AWS_S3_INPUT_BUCKET.");
    error.status = 400;
    throw error;
  }

  const command = new PutObjectCommand({
    Bucket: env.aws.inputBucket,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

function hlsOutput({ nameModifier, width, height, bitrate }) {
  return {
    NameModifier: nameModifier,
    ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
    VideoDescription: {
      Width: width,
      Height: height,
      CodecSettings: {
        Codec: "H_264",
        H264Settings: {
          RateControlMode: "QVBR",
          QvbrSettings: { QvbrQualityLevel: 7 },
          MaxBitrate: bitrate,
          CodecProfile: "MAIN",
          CodecLevel: "AUTO",
          GopSize: 2,
          GopSizeUnits: "SECONDS"
        }
      }
    },
    AudioDescriptions: [
      {
        AudioSourceName: "Audio Selector 1",
        CodecSettings: {
          Codec: "AAC",
          AacSettings: {
            Bitrate: 96000,
            CodingMode: "CODING_MODE_2_0",
            SampleRate: 48000
          }
        }
      }
    ]
  };
}

export async function createMediaConvertJob({ inputKey, outputPrefix, movieId, episodeId }) {
  requireAwsConfig();

  const client = new MediaConvertClient({
    region: env.aws.region,
    endpoint: env.aws.mediaConvertEndpoint
  });

  const destination = `s3://${env.aws.outputBucket}/${outputPrefix}index`;
  const input = `s3://${env.aws.inputBucket}/${inputKey}`;

  const command = new CreateJobCommand({
    Role: env.aws.mediaConvertRoleArn,
    UserMetadata: {
      movieId: String(movieId),
      episodeId: String(episodeId),
      project: "netflop"
    },
    Settings: {
      TimecodeConfig: { Source: "ZEROBASED" },
      Inputs: [
        {
          FileInput: input,
          AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } }
        }
      ],
      OutputGroups: [
        {
          Name: "Apple HLS",
          OutputGroupSettings: {
            Type: "HLS_GROUP_SETTINGS",
            HlsGroupSettings: {
              Destination: destination,
              SegmentLength: 6,
              MinSegmentLength: 0,
              ManifestDurationFormat: "INTEGER",
              OutputSelection: "MANIFESTS_AND_SEGMENTS"
            }
          },
          Outputs: [
            hlsOutput({ nameModifier: "_720p", width: 1280, height: 720, bitrate: 2500000 }),
            hlsOutput({ nameModifier: "_480p", width: 854, height: 480, bitrate: 1200000 }),
            hlsOutput({ nameModifier: "_360p", width: 640, height: 360, bitrate: 700000 })
          ]
        }
      ]
    }
  });

  return client.send(command);
}

export async function getMediaConvertJob(jobId) {
  requireAwsConfig();
  const client = new MediaConvertClient({
    region: env.aws.region,
    endpoint: env.aws.mediaConvertEndpoint
  });

  return client.send(new GetJobCommand({ Id: jobId }));
}
