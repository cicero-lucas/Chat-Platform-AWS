import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchClient, GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { withAuth, response, AuthContext } from '../../shared/middleware/auth';
import { logger } from '../../shared/utils/logger';

const cloudwatch = new CloudWatchClient({});

export const metricsHandler = withAuth(
  async (_event: APIGatewayProxyEvent, auth: AuthContext): Promise<APIGatewayProxyResult> => {
    if (auth.role !== 'ADMIN') {
      return response(403, { error: 'Admin access required' });
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    try {
      const result = await cloudwatch.send(new GetMetricDataCommand({
        StartTime: startTime,
        EndTime: endTime,
        MetricDataQueries: [
          {
            Id: 'messages',
            MetricStat: {
              Metric: {
                Namespace: 'ChatApp',
                MetricName: 'MessagesSent',
              },
              Period: 3600,
              Stat: 'Sum',
            },
          },
          {
            Id: 'activeUsers',
            MetricStat: {
              Metric: {
                Namespace: 'ChatApp',
                MetricName: 'ActiveConnections',
              },
              Period: 3600,
              Stat: 'Average',
            },
          },
          {
            Id: 'errors',
            MetricStat: {
              Metric: {
                Namespace: 'ChatApp',
                MetricName: 'MessageErrors',
              },
              Period: 3600,
              Stat: 'Sum',
            },
          },
        ],
      }));

      const metrics = result.MetricDataResults?.reduce((acc, m) => {
        acc[m.Id!] = {
          timestamps: m.Timestamps,
          values: m.Values,
        };
        return acc;
      }, {} as Record<string, unknown>);

      logger.info('Admin metrics fetched', { adminId: auth.userId });
      return response(200, { metrics, period: { startTime, endTime } });
    } catch (error) {
      logger.error('Metrics fetch failed', { error: (error as Error).message });
      return response(500, { error: 'Internal server error' });
    }
  }
);
