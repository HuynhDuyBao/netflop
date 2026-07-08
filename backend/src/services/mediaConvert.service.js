const awsConfig = require('../config/aws');
const HttpError = require('../utils/httpError');

function assertMediaConvertConfig() {
  if (!awsConfig.s3OutputBucket || !awsConfig.mediaConvertRoleArn) {
    throw new HttpError(500, 'AWS_S3_OUTPUT_BUCKET hoac AWS_MEDIACONVERT_ROLE_ARN chua duoc cau hinh.');
  }
}

function createClient(MediaConvertClient) {
  const options = { region: awsConfig.region };

  if (awsConfig.mediaConvertEndpoint) {
    options.endpoint = awsConfig.mediaConvertEndpoint;
  }

  return new MediaConvertClient(options);
}

function createHlsOutput({ nameModifier, width, height, maxBitrate, qvbrQualityLevel }) {
  return {
    NameModifier: nameModifier,
    ContainerSettings: { Container: 'M3U8' },
    VideoDescription: {
      Width: width,
      Height: height,
      CodecSettings: {
        Codec: 'H_264',
        H264Settings: {
          RateControlMode: 'QVBR',
          MaxBitrate: maxBitrate,
          QvbrSettings: { QvbrQualityLevel: qvbrQualityLevel },
          CodecProfile: 'MAIN',
          CodecLevel: 'AUTO',
          GopSize: 2,
          GopSizeUnits: 'SECONDS',
          GopClosedCadence: 1
        }
      }
    },
    AudioDescriptions: [
      {
        AudioSourceName: 'Audio Selector 1',
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
  };
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
  const masterKey = `${outputPrefix}index.m3u8`;
  const client = createClient(MediaConvertClient);

  const command = new CreateJobCommand({
    Role: awsConfig.mediaConvertRoleArn,
    UserMetadata: {
      movieId: String(movieId),
      episodeId: String(episodeId),
      outputPrefix,
      masterKey
    },
    Settings: {
      Inputs: [
        {
          FileInput: inputS3Uri,
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT'
            }
          }
        }
      ],
      OutputGroups: [
        {
          Name: 'Apple HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              Destination: `s3://${awsConfig.s3OutputBucket}/${outputPrefix}index`,
              SegmentLength: 6,
              MinSegmentLength: 0,
              DirectoryStructure: 'SINGLE_DIRECTORY',
              ManifestDurationFormat: 'INTEGER',
              OutputSelection: 'MANIFESTS_AND_SEGMENTS',
              StreamInfResolution: 'INCLUDE'
            }
          },
          Outputs: [
            createHlsOutput({ nameModifier: '_360p', width: 640, height: 360, maxBitrate: 900000, qvbrQualityLevel: 6 }),
            createHlsOutput({ nameModifier: '_480p', width: 854, height: 480, maxBitrate: 1400000, qvbrQualityLevel: 6 }),
            createHlsOutput({ nameModifier: '_720p', width: 1280, height: 720, maxBitrate: 3500000, qvbrQualityLevel: 7 }),
            createHlsOutput({ nameModifier: '_1080p', width: 1920, height: 1080, maxBitrate: 6500000, qvbrQualityLevel: 8 })
          ]
        }
      ]
    }
  });

  const result = await client.send(command);

  return {
    jobId: result.Job?.Id,
    outputPrefix,
    masterKey
  };
}

async function getJob(jobId) {
  if (!jobId) {
    throw new HttpError(400, 'Thieu MediaConvert job id.');
  }

  let MediaConvertClient;
  let GetJobCommand;

  try {
    ({ MediaConvertClient, GetJobCommand } = require('@aws-sdk/client-mediaconvert'));
  } catch (error) {
    throw new HttpError(500, 'Missing AWS SDK. Run: npm --prefix backend install');
  }

  const client = createClient(MediaConvertClient);
  const result = await client.send(new GetJobCommand({ Id: jobId }));
  return result.Job;
}

module.exports = {
  createHlsJob,
  getJob
};
