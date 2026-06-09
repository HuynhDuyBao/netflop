const awsConfig = require('../config/aws');
const HttpError = require('../utils/httpError');

function assertMediaConvertConfig() {
  if (!awsConfig.s3OutputBucket || !awsConfig.mediaConvertRoleArn) {
    throw new HttpError(500, 'AWS_S3_OUTPUT_BUCKET hoac AWS_MEDIACONVERT_ROLE_ARN chua duoc cau hinh.');
  }
}

async function createHlsJob({ inputS3Uri, movieId, episodeId }) {
  assertMediaConvertConfig();

  let MediaConvertClient;
  let CreateJobCommand;

  try {
    ({ MediaConvertClient, CreateJobCommand } = require('@aws-sdk/client-mediaconvert'));
  } catch (error) {
    throw new HttpError(500, 'Missing AWS SDK. Run: npm --prefix backend install');
  }

  const outputPrefix = `movies/${movieId}/episodes/${episodeId}/hls/`;
  const client = new MediaConvertClient({ region: awsConfig.region });

  const command = new CreateJobCommand({
    Role: awsConfig.mediaConvertRoleArn,
    Settings: {
      Inputs: [{ FileInput: inputS3Uri }],
      OutputGroups: [
        {
          Name: 'Apple HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              Destination: `s3://${awsConfig.s3OutputBucket}/${outputPrefix}`,
              SegmentLength: 6,
              MinSegmentLength: 0
            }
          },
          Outputs: [
            {
              NameModifier: '_720p',
              ContainerSettings: { Container: 'M3U8' },
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    QvbrSettings: { QvbrQualityLevel: 7 }
                  }
                }
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 96000,
                      CodingMode: 'CODING_MODE_2_0',
                      SampleRate: 48000
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  });

  const result = await client.send(command);

  return {
    jobId: result.Job?.Id,
    outputPrefix,
    masterKey: `${outputPrefix}index.m3u8`
  };
}

module.exports = {
  createHlsJob
};
