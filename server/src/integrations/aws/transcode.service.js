const { CreateJobCommand, GetJobCommand } = require('@aws-sdk/client-mediaconvert');
const env = require('../../config/env');
const { requireAwsConfig } = require('./config');
const { getMediaConvertClient } = require('./mediaconvert.client');

function getHlsJobSettings({ inputUrl, outputDestination }) {
  return {
    Role: env.aws.mediaConvertRoleArn,
    Settings: {
      TimecodeConfig: {
        Source: 'ZEROBASED'
      },
      Inputs: [
        {
          FileInput: inputUrl,
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT'
            }
          },
          VideoSelector: {}
        }
      ],
      OutputGroups: [
        {
          Name: 'Apple HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              Destination: outputDestination,
              SegmentLength: 6,
              MinSegmentLength: 0
            }
          },
          Outputs: [
            {
              NameModifier: '_720p',
              ContainerSettings: {
                Container: 'M3U8',
                M3u8Settings: {}
              },
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    QvbrSettings: {
                      QvbrQualityLevel: 7
                    },
                    MaxBitrate: 3500000
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
            }
          ]
        }
      ]
    }
  };
}

async function createHlsTranscodeJob({ inputKey, outputPrefix }) {
  requireAwsConfig(['inputBucket', 'outputBucket', 'mediaConvertRoleArn', 'mediaConvertEndpoint']);

  const inputUrl = `s3://${env.aws.inputBucket}/${inputKey}`;
  const outputDestination = `s3://${env.aws.outputBucket}/${outputPrefix}`;
  const command = new CreateJobCommand(getHlsJobSettings({ inputUrl, outputDestination }));
  const result = await getMediaConvertClient().send(command);

  return result.Job;
}

async function getTranscodeJob(jobId) {
  requireAwsConfig(['mediaConvertEndpoint']);

  const command = new GetJobCommand({ Id: jobId });
  const result = await getMediaConvertClient().send(command);

  return result.Job;
}

module.exports = {
  createHlsTranscodeJob,
  getTranscodeJob
};
