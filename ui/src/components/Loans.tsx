import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Modal, Form, Input, Message, Table, Label, Dimmer, Loader } from 'semantic-ui-react';
import { StablecoinHolding } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { Loan, LoanRequest } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Loan';
import { getDisplayName, getAllParties } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const Loans: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: holdings, loading: holdingsLoading } = useStreamQueries(StablecoinHolding);
  const { contracts: loans, loading: loansLoading } = useStreamQueries(Loan);
  const { contracts: loanRequests, loading: requestsLoading } = useStreamQueries(LoanRequest);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [selectedCollateral, setSelectedCollateral] = useState<any>(null);
  const [selectedRepayment, setSelectedRepayment] = useState<any>(null);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [loanDuration, setLoanDuration] = useState('30');
  const [proposedRate, setProposedRate] = useState('5.0');
  const [isProcessing, setIsProcessing] = useState(false);

  const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId || '';
  const isBank = party === bankParty;

  // Filter data
  const myLoans = loans.filter(l => l.payload.borrower === party);
  const myRequests = loanRequests.filter(r => r.payload.borrower === party);
  const availableCollateral = holdings.filter(h => h.payload.owner === party && !h.payload.frozen);
  const availableForRepayment = holdings.filter(h => h.payload.owner === party && !h.payload.frozen);

  // Bank view
  const pendingRequests = loanRequests.filter(r => r.payload.bank === party);
  const allActiveLoans = loans.filter(l => l.payload.bank === party);

  const handleRequestLoan = async () => {
    if (!requestedAmount || parseFloat(requestedAmount) <= 0) {
      showWarning('Please enter a valid loan amount');
      return;
    }

    if (!selectedCollateral) {
      showWarning('Please select collateral');
      return;
    }

    const amount = parseFloat(requestedAmount);
    const collateralValue = parseFloat(selectedCollateral.payload.amount);
    const requiredCollateral = amount * 1.5; // 150% collateralization

    if (collateralValue < requiredCollateral) {
      showError('Insufficient collateral', `You need at least $${requiredCollateral.toFixed(2)} as collateral for a $${amount.toFixed(2)} loan`);
      return;
    }

    setIsProcessing(true);
    try {
      await ledger.create(LoanRequest, {
        bank: bankParty,
        borrower: party,
        requestedAmount: requestedAmount,
        collateralCid: selectedCollateral.contractId,
        currency: selectedCollateral.payload.currency,
        requestedDuration: loanDuration,
        proposedInterestRate: (parseFloat(proposedRate) / 100).toString(),
      });

      showSuccess(`Loan request for $${amount.toFixed(2)} submitted to Bank`);
      setRequestModalOpen(false);
      setRequestedAmount('');
      setSelectedCollateral(null);
    } catch (error) {
      showError('Failed to request loan', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveLoan = async (request: any) => {
    setIsProcessing(true);
    try {
      const loanId = `LOAN-${Date.now()}`;
      const currentDate = new Date().toISOString().split('T')[0];

      await ledger.exercise(LoanRequest.ApproveLoanRequest, request.contractId, {
        approvedInterestRate: request.payload.proposedInterestRate,
        approvalDate: currentDate,
        loanId: loanId,
      });

      showSuccess(`Loan approved for ${getDisplayName(request.payload.borrower)}`);
    } catch (error) {
      showError('Failed to approve loan', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectLoan = async (requestCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(LoanRequest.RejectLoanRequest, requestCid, {});
      showSuccess('Loan request rejected and collateral returned');
    } catch (error) {
      showError('Failed to reject loan', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepayLoan = async () => {
    if (!selectedLoan || !selectedRepayment) {
      showWarning('Please select a repayment method');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const totalOwed = parseFloat(selectedLoan.payload.principal) + parseFloat(selectedLoan.payload.accruedInterest);
    const repaymentAmount = parseFloat(selectedRepayment.payload.amount);

    if (repaymentAmount < totalOwed) {
      showError('Insufficient funds', `You need $${totalOwed.toFixed(2)} to fully repay this loan`);
      return;
    }

    setIsProcessing(true);
    try {
      await ledger.exercise(Loan.RepayLoan, selectedLoan.contractId, {
        repaymentCid: selectedRepayment.contractId,
        currentDate: currentDate,
      });

      showSuccess('Loan repaid successfully! Collateral returned.');
      setRepayModalOpen(false);
      setSelectedLoan(null);
      setSelectedRepayment(null);
    } catch (error) {
      showError('Failed to repay loan', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRepayModal = (loan: any) => {
    setSelectedLoan(loan);
    setSelectedRepayment(null);
    setRepayModalOpen(true);
  };

  if (holdingsLoading || loansLoading || requestsLoading) {
    return (
      <Dimmer active inverted>
        <Loader size='large'>Loading loans...</Loader>
      </Dimmer>
    );
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              <Icon name='money bill alternate' />
              Loans & Interest
            </Header>

            {/* Action Buttons - User View */}
            {!isBank && (
              <Segment>
                <Button
                  color='green'
                  size='large'
                  fluid
                  onClick={() => setRequestModalOpen(true)}
                  disabled={availableCollateral.length === 0}
                >
                  <Icon name='plus circle' />
                  Request New Loan
                </Button>
                {availableCollateral.length === 0 && (
                  <Message warning style={{ marginTop: '1em' }}>
                    You need stablecoin holdings to use as collateral
                  </Message>
                )}
              </Segment>
            )}

            {/* User's Active Loans */}
            {!isBank && (
              <Segment>
                <Header as='h2'>
                  <Icon name='file alternate' color='blue' />
                  <Header.Content>
                    My Active Loans
                    <Header.Subheader>{myLoans.length} active loan{myLoans.length !== 1 ? 's' : ''}</Header.Subheader>
                  </Header.Content>
                </Header>

                {myLoans.length === 0 ? (
                  <Message info>No active loans</Message>
                ) : (
                  <Card.Group>
                    {myLoans.map(loan => {
                      const totalOwed = parseFloat(loan.payload.principal) + parseFloat(loan.payload.accruedInterest);
                      const interestRate = parseFloat(loan.payload.interestRate) * 100;

                      return (
                        <Card key={loan.contractId} fluid color='blue'>
                          <Card.Content>
                            <Card.Header>
                              Loan #{loan.payload.loanId}
                            </Card.Header>
                            <Card.Meta>
                              <div>Principal: ${parseFloat(loan.payload.principal).toFixed(2)}</div>
                              <div>Interest Rate: {interestRate.toFixed(2)}% APR</div>
                            </Card.Meta>
                            <Card.Description style={{ marginTop: '1em' }}>
                              <p><strong>Accrued Interest:</strong> ${parseFloat(loan.payload.accruedInterest).toFixed(2)}</p>
                              <p><strong>Total Owed:</strong> ${totalOwed.toFixed(2)}</p>
                              <p><strong>Collateral:</strong> ${parseFloat(loan.payload.collateralAmount).toFixed(2)}</p>
                              <p><strong>Due Date:</strong> {loan.payload.dueDate}</p>
                            </Card.Description>
                          </Card.Content>
                          <Card.Content extra>
                            <Button
                              color='green'
                              fluid
                              onClick={() => openRepayModal(loan)}
                              disabled={isProcessing}
                            >
                              <Icon name='dollar' />
                              Repay Loan
                            </Button>
                          </Card.Content>
                        </Card>
                      );
                    })}
                  </Card.Group>
                )}
              </Segment>
            )}

            {/* Pending Loan Requests */}
            {!isBank && myRequests.length > 0 && (
              <Segment>
                <Header as='h2'>
                  <Icon name='hourglass half' color='orange' />
                  <Header.Content>
                    Pending Loan Requests
                    <Header.Subheader>Waiting for bank approval</Header.Subheader>
                  </Header.Content>
                </Header>

                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Collateral</Table.HeaderCell>
                      <Table.HeaderCell>Rate</Table.HeaderCell>
                      <Table.HeaderCell>Duration</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {myRequests.map(request => (
                      <Table.Row key={request.contractId}>
                        <Table.Cell>${parseFloat(request.payload.requestedAmount).toFixed(2)}</Table.Cell>
                        <Table.Cell>Locked</Table.Cell>
                        <Table.Cell>{(parseFloat(request.payload.proposedInterestRate) * 100).toFixed(2)}%</Table.Cell>
                        <Table.Cell>{request.payload.requestedDuration} days</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Segment>
            )}

            {/* Bank Admin View */}
            {isBank && (
              <>
                <Segment>
                  <Header as='h2'>
                    <Icon name='university' color='blue' />
                    <Header.Content>
                      Loan Portfolio Overview
                      <Header.Subheader>{allActiveLoans.length} active loans, {pendingRequests.length} pending requests</Header.Subheader>
                    </Header.Content>
                  </Header>

                  <Grid columns={2} divided>
                    <Grid.Row>
                      <Grid.Column>
                        <Header as='h3' color='green'>
                          ${allActiveLoans.reduce((sum, l) => sum + parseFloat(l.payload.principal), 0).toFixed(2)}
                          <Header.Subheader>Total Loaned</Header.Subheader>
                        </Header>
                      </Grid.Column>
                      <Grid.Column>
                        <Header as='h3' color='blue'>
                          ${allActiveLoans.reduce((sum, l) => sum + parseFloat(l.payload.accruedInterest), 0).toFixed(2)}
                          <Header.Subheader>Total Interest Accrued</Header.Subheader>
                        </Header>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>

                <Segment>
                  <Header as='h2'>
                    <Icon name='clipboard list' color='orange' />
                    Pending Loan Requests
                  </Header>

                  {pendingRequests.length === 0 ? (
                    <Message info>No pending loan requests</Message>
                  ) : (
                    <Table celled>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Borrower</Table.HeaderCell>
                          <Table.HeaderCell>Amount</Table.HeaderCell>
                          <Table.HeaderCell>Rate</Table.HeaderCell>
                          <Table.HeaderCell>Duration</Table.HeaderCell>
                          <Table.HeaderCell>Actions</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {pendingRequests.map(request => (
                          <Table.Row key={request.contractId}>
                            <Table.Cell>
                              <Icon name='user' />
                              {getDisplayName(request.payload.borrower)}
                            </Table.Cell>
                            <Table.Cell>
                              <strong>${parseFloat(request.payload.requestedAmount).toFixed(2)}</strong>
                            </Table.Cell>
                            <Table.Cell>{(parseFloat(request.payload.proposedInterestRate) * 100).toFixed(2)}%</Table.Cell>
                            <Table.Cell>{request.payload.requestedDuration} days</Table.Cell>
                            <Table.Cell>
                              <Button.Group size='small'>
                                <Button
                                  positive
                                  onClick={() => handleApproveLoan(request)}
                                  disabled={isProcessing}
                                >
                                  <Icon name='check' />
                                  Approve
                                </Button>
                                <Button
                                  negative
                                  onClick={() => handleRejectLoan(request.contractId)}
                                  disabled={isProcessing}
                                >
                                  <Icon name='close' />
                                  Reject
                                </Button>
                              </Button.Group>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )}
                </Segment>
              </>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Request Loan Modal */}
      <Modal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='plus circle' color='green' />
          Request New Loan
        </Modal.Header>
        <Modal.Content>
          <Message info>
            <Message.Header>Collateralized Loan</Message.Header>
            <p>You must provide collateral worth at least 150% of the loan amount. Your collateral will be locked until you repay the loan.</p>
          </Message>
          <Form>
            <Form.Field required>
              <label>Loan Amount</label>
              <Input
                type='number'
                placeholder='Enter amount...'
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                step='0.01'
                min='0.01'
                label={{ basic: true, content: 'USD' }}
                labelPosition='right'
              />
            </Form.Field>
            <Form.Field required>
              <label>Loan Duration</label>
              <Input
                type='number'
                placeholder='Days'
                value={loanDuration}
                onChange={(e) => setLoanDuration(e.target.value)}
                label={{ basic: true, content: 'days' }}
                labelPosition='right'
              />
            </Form.Field>
            <Form.Field required>
              <label>Proposed Interest Rate (APR)</label>
              <Input
                type='number'
                placeholder='5.0'
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                step='0.1'
                min='0'
                label={{ basic: true, content: '%' }}
                labelPosition='right'
              />
            </Form.Field>
            <Form.Field required>
              <label>Select Collateral</label>
              <Card.Group>
                {availableCollateral.map(holding => {
                  const isSelected = selectedCollateral?.contractId === holding.contractId;
                  const requiredCollateral = parseFloat(requestedAmount || '0') * 1.5;
                  const isSufficient = parseFloat(holding.payload.amount) >= requiredCollateral;

                  return (
                    <Card
                      key={holding.contractId}
                      fluid
                      color={isSelected ? 'green' : (isSufficient ? 'blue' : undefined)}
                      onClick={() => setSelectedCollateral(holding)}
                      style={{ cursor: 'pointer', opacity: isSufficient ? 1 : 0.5 }}
                    >
                      <Card.Content>
                        <Card.Header>
                          {isSelected && <Icon name='check circle' color='green' />}
                          ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                        </Card.Header>
                        <Card.Meta>
                          {isSufficient ? (
                            <Label color='green'>Sufficient Collateral</Label>
                          ) : (
                            <Label color='red'>Insufficient (need ${requiredCollateral.toFixed(2)})</Label>
                          )}
                        </Card.Meta>
                      </Card.Content>
                    </Card>
                  );
                })}
              </Card.Group>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setRequestModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='green'
            disabled={!requestedAmount || !selectedCollateral || isProcessing}
            loading={isProcessing}
            onClick={handleRequestLoan}
          >
            <Icon name='check' />
            Submit Loan Request
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Repay Loan Modal */}
      <Modal open={repayModalOpen} onClose={() => setRepayModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='dollar' color='green' />
          Repay Loan
        </Modal.Header>
        <Modal.Content>
          {selectedLoan && (
            <>
              <Segment color='blue'>
                <Header as='h4'>Loan Details</Header>
                <p><strong>Principal:</strong> ${parseFloat(selectedLoan.payload.principal).toFixed(2)}</p>
                <p><strong>Accrued Interest:</strong> ${parseFloat(selectedLoan.payload.accruedInterest).toFixed(2)}</p>
                <p><strong>Total Owed:</strong> ${(parseFloat(selectedLoan.payload.principal) + parseFloat(selectedLoan.payload.accruedInterest)).toFixed(2)}</p>
                <p><strong>Collateral:</strong> ${parseFloat(selectedLoan.payload.collateralAmount).toFixed(2)}</p>
              </Segment>

              <Header as='h4'>Select Payment Source:</Header>
              <Card.Group>
                {availableForRepayment.map(holding => {
                  const isSelected = selectedRepayment?.contractId === holding.contractId;
                  const totalOwed = parseFloat(selectedLoan.payload.principal) + parseFloat(selectedLoan.payload.accruedInterest);
                  const isSufficient = parseFloat(holding.payload.amount) >= totalOwed;

                  return (
                    <Card
                      key={holding.contractId}
                      fluid
                      color={isSelected ? 'green' : undefined}
                      onClick={() => setSelectedRepayment(holding)}
                      style={{ cursor: 'pointer', opacity: isSufficient ? 1 : 0.5 }}
                    >
                      <Card.Content>
                        <Card.Header>
                          {isSelected && <Icon name='check circle' color='green' />}
                          ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                        </Card.Header>
                        <Card.Meta>
                          {isSufficient ? (
                            <Label color='green'>Sufficient Funds</Label>
                          ) : (
                            <Label color='red'>Insufficient (need ${totalOwed.toFixed(2)})</Label>
                          )}
                        </Card.Meta>
                      </Card.Content>
                    </Card>
                  );
                })}
              </Card.Group>
            </>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setRepayModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='green'
            disabled={!selectedRepayment || isProcessing}
            loading={isProcessing}
            onClick={handleRepayLoan}
          >
            <Icon name='check' />
            Repay Loan
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default Loans;