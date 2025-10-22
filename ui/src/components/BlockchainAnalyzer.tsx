import React, { useState, useEffect, useMemo } from 'react';
import { useStreamQueries, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Statistic, Table, Icon, Card, Progress, Label, Message } from 'semantic-ui-react';
import { StablecoinHolding, TransactionHistory, TransferProposal, IssuanceRequest, RedemptionRequest, BankReserve } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { getDisplayName } from '../config/parties';

interface MetricCardProps {
  icon: string;
  color: any;
  label: string;
  value: string | number;
  subvalue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, color, label, value, subvalue }) => (
  <Card fluid color={color}>
    <Card.Content>
      <Card.Header>
        <Icon name={icon as any} color={color} />
        {label}
      </Card.Header>
      <Statistic size='small'>
        <Statistic.Value>{value}</Statistic.Value>
        {subvalue && <Statistic.Label>{subvalue}</Statistic.Label>}
      </Statistic>
    </Card.Content>
  </Card>
);

const BlockchainAnalyzer: React.FC = () => {
  const party = useParty();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  // Query all contract types
  const { contracts: holdings, loading: holdingsLoading } = useStreamQueries(StablecoinHolding);
  const { contracts: history, loading: historyLoading } = useStreamQueries(TransactionHistory);
  const { contracts: proposals, loading: proposalsLoading } = useStreamQueries(TransferProposal);
  const { contracts: issuanceRequests, loading: issuanceLoading } = useStreamQueries(IssuanceRequest);
  const { contracts: redemptionRequests, loading: redemptionLoading } = useStreamQueries(RedemptionRequest);
  const { contracts: reserves, loading: reservesLoading } = useStreamQueries(BankReserve);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
      const totalContracts = holdings.length + history.length + proposals.length + 
                            issuanceRequests.length + redemptionRequests.length + reserves.length;
      
      const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.payload.amount), 0);
      
      const activeTransfers = proposals.length;
      const pendingRequests = issuanceRequests.length + redemptionRequests.length;
      
      // Get recent transactions (last 10)
      const recentTxs = [...history]
        .sort((a, b) => new Date(b.payload.timestamp).getTime() - new Date(a.payload.timestamp).getTime())
        .slice(0, 10);
      
      // Calculate transaction throughput (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTxCount = history.filter(h => 
        new Date(h.payload.timestamp) > oneHourAgo
      ).length;

      // Get unique participants
      const uniqueParticipants = new Set<string>();
      holdings.forEach(h => {
        uniqueParticipants.add(h.payload.owner);
        uniqueParticipants.add(h.payload.issuer);
      });
      history.forEach(h => {
        if (h.payload.fromParty) uniqueParticipants.add(h.payload.fromParty);
        if (h.payload.toParty) uniqueParticipants.add(h.payload.toParty);
      });
      
      // Calculate network health score (0-100) - Enhanced Algorithm
      // Base Health (40 points)
      const baseHealth = 
        (totalContracts > 0 ? 20 : 0) +
        (holdings.length > 0 ? 20 : 0);
      
      // Activity Health (30 points)
      const activityHealth = 
        Math.min(15, recentTxCount * 1.5) +  // Up to 15 pts for recent activity (10+ tx/hr = max)
        Math.min(15, history.length * 0.5);  // Up to 15 pts for history depth (30+ tx = max)
      
      // Network Health (30 points)
      const networkHealth = 
        Math.min(10, uniqueParticipants.size * 3.33) +  // Up to 10 pts for participants (3+ = max)
        (reserves.length > 0 ? 10 : 0) +  // 10 pts for reserves existence
        (pendingRequests < 5 ? 5 : pendingRequests < 10 ? 3 : 0) +  // 5 pts if low pending load
        (activeTransfers < 5 ? 5 : activeTransfers < 10 ? 3 : 0);  // 5 pts if low transfer backlog
      
      const healthScore = Math.min(100, baseHealth + activityHealth + networkHealth);

      // Contract type distribution
      const contractTypes = {
        holdings: holdings.length,
        history: history.length,
        proposals: proposals.length,
        issuanceRequests: issuanceRequests.length,
        redemptionRequests: redemptionRequests.length,
        reserves: reserves.length,
      };

      return {
        totalContracts,
        totalValue,
        activeTransfers,
        pendingRequests,
        recentTxs,
        recentTxCount,
        healthScore,
        baseHealth,
        activityHealth,
        networkHealth,
        uniqueParticipants: uniqueParticipants.size,
        contractTypes,
      };
    }, [holdings, history, proposals, issuanceRequests, redemptionRequests, reserves]);

  const loading = holdingsLoading || historyLoading || proposalsLoading || 
                  issuanceLoading || redemptionLoading || reservesLoading;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Degraded';
  };

  if (loading) {
    return (
      <Container style={{ marginTop: '2em' }}>
        <Message icon>
          <Icon name='circle notched' loading />
          <Message.Content>
            <Message.Header>Analyzing Blockchain</Message.Header>
            Loading ledger data...
          </Message.Content>
        </Message>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              <Icon name='chart line' />
              Blockchain Analyzer
            </Header>

            {/* System Status */}
            <Segment>
              <Header as='h2'>
                <Icon name='server' />
                <Header.Content>
                  System Status
                  <Header.Subheader>Real-time ledger health and performance</Header.Subheader>
                </Header.Content>
              </Header>

              <Grid columns={3} stackable>
                <Grid.Column>
                  <Statistic size='small'>
                    <Statistic.Label>Network Health</Statistic.Label>
                    <Statistic.Value style={{ color: getHealthColor(metrics.healthScore) }}>
                    {Math.round(metrics.healthScore)}%
                    </Statistic.Value>
                    <Statistic.Label>{getHealthStatus(metrics.healthScore)}</Statistic.Label>
                  </Statistic>
                  <Progress 
                    percent={metrics.healthScore} 
                    color={getHealthColor(metrics.healthScore)}
                    size='small'
                    style={{ marginTop: '1em' }}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Statistic size='small' color='blue'>
                    <Statistic.Label>Uptime</Statistic.Label>
                    <Statistic.Value>{formatUptime(uptime)}</Statistic.Value>
                    <Statistic.Label>Session Duration</Statistic.Label>
                  </Statistic>
                </Grid.Column>
                <Grid.Column>
                  <Statistic size='small' color='teal'>
                    <Statistic.Label>Current Time</Statistic.Label>
                    <Statistic.Value style={{ fontSize: '1.2em' }}>
                      {currentTime.toLocaleTimeString()}
                    </Statistic.Value>
                    <Statistic.Label>{currentTime.toLocaleDateString()}</Statistic.Label>
                  </Statistic>
                </Grid.Column>
              </Grid>
            </Segment>

            {/* Health Score Breakdown */}
            <Segment>
              <Header as='h2'>
                <Icon name='heartbeat' />
                <Header.Content>
                  Health Score Breakdown
                  <Header.Subheader>Detailed component analysis (max 100 points)</Header.Subheader>
                </Header.Content>
              </Header>

              <Grid columns={3} stackable divided>
                <Grid.Column>
                  <Header as='h3' color='blue'>
                    <Icon name='database' />
                    Base Health
                    <Header.Subheader>{metrics.baseHealth}/40 points</Header.Subheader>
                  </Header>
                  <Progress 
                    percent={(metrics.baseHealth / 40) * 100} 
                    color='blue'
                    size='small'
                  />
                  <Table basic='very' compact size='small'>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='check circle' color={metrics.totalContracts > 0 ? 'green' : 'grey'} />
                          Contracts Exist
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{metrics.totalContracts > 0 ? '20' : '0'}/20</strong>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='check circle' color={holdings.length > 0 ? 'green' : 'grey'} />
                          Holdings Exist
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{holdings.length > 0 ? '20' : '0'}/20</strong>
                        </Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table>
                </Grid.Column>

                <Grid.Column>
                  <Header as='h3' color='orange'>
                    <Icon name='lightning' />
                    Activity Health
                    <Header.Subheader>{metrics.activityHealth.toFixed(1)}/30 points</Header.Subheader>
                  </Header>
                  <Progress 
                    percent={(metrics.activityHealth / 30) * 100} 
                    color='orange'
                    size='small'
                  />
                  <Table basic='very' compact size='small'>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='chart line' color={metrics.recentTxCount > 0 ? 'green' : 'grey'} />
                          Recent Activity
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{Math.min(15, metrics.recentTxCount * 1.5).toFixed(1)}/15</strong>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='history' color={history.length > 0 ? 'green' : 'grey'} />
                          History Depth
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{Math.min(15, history.length * 0.5).toFixed(1)}/15</strong>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell colSpan='2'>
                          <small style={{ color: '#666' }}>
                            📊 {metrics.recentTxCount} tx/hour | {history.length} total
                          </small>
                        </Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table>
                </Grid.Column>

                <Grid.Column>
                  <Header as='h3' color='purple'>
                    <Icon name='sitemap' />
                    Network Health
                    <Header.Subheader>{metrics.networkHealth.toFixed(1)}/30 points</Header.Subheader>
                  </Header>
                  <Progress 
                    percent={(metrics.networkHealth / 30) * 100} 
                    color='purple'
                    size='small'
                  />
                  <Table basic='very' compact size='small'>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='users' color={metrics.uniqueParticipants > 0 ? 'green' : 'grey'} />
                          Participants
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{Math.min(10, metrics.uniqueParticipants * 3.33).toFixed(1)}/10</strong>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='lock' color={reserves.length > 0 ? 'green' : 'grey'} />
                          Reserves
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{reserves.length > 0 ? '10' : '0'}/10</strong>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='hourglass half' color={metrics.pendingRequests < 5 ? 'green' : metrics.pendingRequests < 10 ? 'yellow' : 'red'} />
                          Low Pending Load
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{metrics.pendingRequests < 5 ? '5' : metrics.pendingRequests < 10 ? '3' : '0'}/5</strong>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <Icon name='exchange' color={metrics.activeTransfers < 5 ? 'green' : metrics.activeTransfers < 10 ? 'yellow' : 'red'} />
                          Low Transfer Backlog
                        </Table.Cell>
                        <Table.Cell textAlign='right'>
                          <strong>{metrics.activeTransfers < 5 ? '5' : metrics.activeTransfers < 10 ? '3' : '0'}/5</strong>
                        </Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table>
                </Grid.Column>
              </Grid>

              <Message info style={{ marginTop: '1em' }}>
                <Message.Header>How Health Score Works</Message.Header>
                <Message.List>
                  <Message.Item><strong>Base Health (40 pts):</strong> Fundamental ledger existence - contracts and holdings</Message.Item>
                  <Message.Item><strong>Activity Health (30 pts):</strong> Transaction velocity and history depth</Message.Item>
                  <Message.Item><strong>Network Health (30 pts):</strong> Participants, reserves, and system load</Message.Item>
                </Message.List>
              </Message>
            </Segment>

            {/* Key Metrics */}
            <Segment>
              <Header as='h2'>
                <Icon name='dashboard' />
                <Header.Content>
                  Key Metrics
                  <Header.Subheader>Current blockchain statistics</Header.Subheader>
                </Header.Content>
              </Header>

              <Grid columns={4} stackable>
                <Grid.Column>
                  <MetricCard
                    icon='file alternate'
                    color='blue'
                    label='Total Contracts'
                    value={metrics.totalContracts}
                    subvalue='Active on Ledger'
                  />
                </Grid.Column>
                <Grid.Column>
                  <MetricCard
                    icon='dollar'
                    color='green'
                    label='Total Value Locked'
                    value={`$${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subvalue='USD'
                  />
                </Grid.Column>
                <Grid.Column>
                  <MetricCard
                    icon='exchange'
                    color='orange'
                    label='Active Transfers'
                    value={metrics.activeTransfers}
                    subvalue='Pending Proposals'
                  />
                </Grid.Column>
                <Grid.Column>
                  <MetricCard
                    icon='users'
                    color='purple'
                    label='Network Participants'
                    value={metrics.uniqueParticipants}
                    subvalue='Unique Parties'
                  />
                </Grid.Column>
              </Grid>

              <Grid columns={3} stackable style={{ marginTop: '1em' }}>
                <Grid.Column>
                  <MetricCard
                    icon='history'
                    color='teal'
                    label='Transaction History'
                    value={history.length}
                    subvalue='Total Records'
                  />
                </Grid.Column>
                <Grid.Column>
                  <MetricCard
                    icon='clock'
                    color='yellow'
                    label='Pending Requests'
                    value={metrics.pendingRequests}
                    subvalue='Issuance + Redemption'
                  />
                </Grid.Column>
                <Grid.Column>
                  <MetricCard
                    icon='lightning'
                    color='red'
                    label='Hourly Throughput'
                    value={metrics.recentTxCount}
                    subvalue='Transactions/Hour'
                  />
                </Grid.Column>
              </Grid>
            </Segment>

            {/* Contract Distribution */}
            <Segment>
              <Header as='h2'>
                <Icon name='pie chart' />
                <Header.Content>
                  Contract Distribution
                  <Header.Subheader>Active contracts by type</Header.Subheader>
                </Header.Content>
              </Header>

              <Table celled striped>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Contract Type</Table.HeaderCell>
                    <Table.HeaderCell>Count</Table.HeaderCell>
                    <Table.HeaderCell>Percentage</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>
                      <Icon name='briefcase' color='blue' /> Stablecoin Holdings
                    </Table.Cell>
                    <Table.Cell>{metrics.contractTypes.holdings}</Table.Cell>
                    <Table.Cell>
                      <Progress 
                        percent={metrics.totalContracts > 0 ? (metrics.contractTypes.holdings / metrics.totalContracts * 100) : 0} 
                        size='tiny'
                        color='blue'
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Label color='blue' size='small'>Active</Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>
                      <Icon name='history' color='teal' /> Transaction History
                    </Table.Cell>
                    <Table.Cell>{metrics.contractTypes.history}</Table.Cell>
                    <Table.Cell>
                      <Progress 
                        percent={metrics.totalContracts > 0 ? (metrics.contractTypes.history / metrics.totalContracts * 100) : 0}
                        size='tiny'
                        color='teal'
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Label color='teal' size='small'>Recorded</Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>
                      <Icon name='paper plane' color='orange' /> Transfer Proposals
                    </Table.Cell>
                    <Table.Cell>{metrics.contractTypes.proposals}</Table.Cell>
                    <Table.Cell>
                      <Progress 
                        percent={metrics.totalContracts > 0 ? (metrics.contractTypes.proposals / metrics.totalContracts * 100) : 0}
                        size='tiny'
                        color='orange'
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Label color='orange' size='small'>Pending</Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>
                      <Icon name='plus circle' color='green' /> Issuance Requests
                    </Table.Cell>
                    <Table.Cell>{metrics.contractTypes.issuanceRequests}</Table.Cell>
                    <Table.Cell>
                      <Progress 
                        percent={metrics.totalContracts > 0 ? (metrics.contractTypes.issuanceRequests / metrics.totalContracts * 100) : 0}
                        size='tiny'
                        color='green'
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Label color='green' size='small'>Pending</Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>
                      <Icon name='minus circle' color='red' /> Redemption Requests
                    </Table.Cell>
                    <Table.Cell>{metrics.contractTypes.redemptionRequests}</Table.Cell>
                    <Table.Cell>
                      <Progress 
                        percent={metrics.totalContracts > 0 ? (metrics.contractTypes.redemptionRequests / metrics.totalContracts * 100) : 0}
                        size='tiny'
                        color='red'
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Label color='red' size='small'>Pending</Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>
                      <Icon name='database' color='purple' /> Bank Reserves
                    </Table.Cell>
                    <Table.Cell>{metrics.contractTypes.reserves}</Table.Cell>
                    <Table.Cell>
                      <Progress 
                        percent={metrics.totalContracts > 0 ? (metrics.contractTypes.reserves / metrics.totalContracts * 100) : 0}
                        size='tiny'
                        color='purple'
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Label color='purple' size='small'>Active</Label>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </Segment>

            {/* Recent Transactions */}
            <Segment>
              <Header as='h2'>
                <Icon name='feed' />
                <Header.Content>
                  Recent Transactions
                  <Header.Subheader>Latest 10 blockchain events</Header.Subheader>
                </Header.Content>
              </Header>

              {metrics.recentTxs.length === 0 ? (
                <Message info>
                  <Message.Header>No Transaction History</Message.Header>
                  <p>No transactions have been recorded yet.</p>
                </Message>
              ) : (
                <Table celled striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell width={2}>Time</Table.HeaderCell>
                      <Table.HeaderCell width={2}>Type</Table.HeaderCell>
                      <Table.HeaderCell width={2}>Amount</Table.HeaderCell>
                      <Table.HeaderCell width={3}>From</Table.HeaderCell>
                      <Table.HeaderCell width={3}>To</Table.HeaderCell>
                      <Table.HeaderCell width={4}>Details</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {metrics.recentTxs.map((tx, idx) => {
                      const timestamp = new Date(tx.payload.timestamp);
                      const timeAgo = Math.floor((Date.now() - timestamp.getTime()) / 1000);
                      const timeString = timeAgo < 60 ? `${timeAgo}s ago` :
                                       timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` :
                                       `${Math.floor(timeAgo / 3600)}h ago`;

                      return (
                        <Table.Row key={idx}>
                          <Table.Cell>
                            <Label size='small' color='grey'>
                              <Icon name='clock' />
                              {timeString}
                            </Label>
                          </Table.Cell>
                          <Table.Cell>
                            <Label size='small' color={
                              tx.payload.transactionType === 'transfer' ? 'orange' :
                              tx.payload.transactionType === 'accept' ? 'green' :
                              tx.payload.transactionType === 'split' ? 'teal' :
                              tx.payload.transactionType === 'merge' ? 'purple' : 'grey'
                            }>
                              {tx.payload.transactionType}
                            </Label>
                          </Table.Cell>
                          <Table.Cell>
                            <strong>${parseFloat(tx.payload.amount).toFixed(2)}</strong> {tx.payload.currency}
                          </Table.Cell>
                          <Table.Cell>
                            {tx.payload.fromParty ? getDisplayName(tx.payload.fromParty) : '-'}
                          </Table.Cell>
                          <Table.Cell>
                            {tx.payload.toParty ? getDisplayName(tx.payload.toParty) : '-'}
                          </Table.Cell>
                          <Table.Cell>{tx.payload.details}</Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              )}
            </Segment>

            {/* Ledger Information */}
            <Segment>
              <Header as='h2'>
                <Icon name='info circle' />
                <Header.Content>
                  Ledger Information
                  <Header.Subheader>Platform and network details</Header.Subheader>
                </Header.Content>
              </Header>

              <Table definition>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell width={4}>Platform</Table.Cell>
                    <Table.Cell>Daml 2.10.2</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Application</Table.Cell>
                    <Table.Cell>Bank Stablecoin Platform v1.0.0</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Current Party</Table.Cell>
                    <Table.Cell>
                      <Label color='blue'>
                        <Icon name='user' />
                        {getDisplayName(party)}
                      </Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Ledger ID</Table.Cell>
                    <Table.Cell>bank-stablecoin-sandbox</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>JSON API</Table.Cell>
                    <Table.Cell>
                      <Label color='green'>
                        <Icon name='check circle' />
                        Connected to http://localhost:7575
                      </Label>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Session Start</Table.Cell>
                    <Table.Cell>{new Date(Date.now() - uptime * 1000).toLocaleString()}</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
};

export default BlockchainAnalyzer;