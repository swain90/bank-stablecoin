import React, { useState, useMemo } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Modal, Form, Input, Message, Table, Label, Dropdown, DropdownProps } from 'semantic-ui-react';
import { StablecoinHolding } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { SwapProposal, SwapOffer, ExchangeRate } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/AtomicSwap';
import { getDisplayName, getAllParties } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const AtomicSwaps: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: holdings, loading: holdingsLoading } = useStreamQueries(StablecoinHolding);
  const { contracts: swapProposals, loading: proposalsLoading } = useStreamQueries(SwapProposal);
  const { contracts: swapOffers, loading: offersLoading } = useStreamQueries(SwapOffer);
  const { contracts: exchangeRates, loading: ratesLoading } = useStreamQueries(ExchangeRate);

  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [acceptOfferModalOpen, setAcceptOfferModalOpen] = useState(false);
  const [acceptProposalModalOpen, setAcceptProposalModalOpen] = useState(false);

  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [selectedAcceptHolding, setSelectedAcceptHolding] = useState<any>(null);
  const [selectedProposerHolding, setSelectedProposerHolding] = useState<any>(null);
  const [selectedOffererHolding, setSelectedOffererHolding] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [counterparty, setCounterparty] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [requestedCurrency, setRequestedCurrency] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId || '';
  const isBank = party === bankParty;

  // Get available currencies from holdings
  const availableCurrencies = useMemo(() => {
    const currencies = new Set(holdings.map(h => h.payload.currency));
    return Array.from(currencies);
  }, [holdings]);

  // Filter data
  const myHoldings = holdings.filter(h => h.payload.owner === party && !h.payload.frozen);
  const incomingProposals = swapProposals.filter(p => p.payload.counterparty === party);
  const outgoingProposals = swapProposals.filter(p => p.payload.proposer === party);
  const publicOffers = swapOffers.filter(o => o.payload.offerer !== party);
  const myOffers = swapOffers.filter(o => o.payload.offerer === party);

  // Get proposer's holdings for accept modal (need to see their available holdings)
  const getProposerHoldings = (proposal: any) => {
    return holdings.filter(h => 
      h.payload.owner === proposal.payload.proposer && 
      h.payload.currency === proposal.payload.proposerCurrency &&
      !h.payload.frozen &&
      parseFloat(h.payload.amount) >= parseFloat(proposal.payload.proposerAmount)
    );
  };

  // Get offerer's holdings for accept modal
  const getOffererHoldings = (offer: any) => {
    return holdings.filter(h => 
      h.payload.owner === offer.payload.offerer && 
      h.payload.currency === offer.payload.offerCurrency &&
      !h.payload.frozen &&
      parseFloat(h.payload.amount) >= parseFloat(offer.payload.offerAmount)
    );
  };

  // Get exchange rate between two currencies
  const getExchangeRate = (from: string, to: string): number | null => {
    const rate = exchangeRates.find(r => 
      r.payload.fromCurrency === from && r.payload.toCurrency === to
    );
    return rate ? parseFloat(rate.payload.rate) : null;
  };

  // Calculate expected amount based on exchange rate
  const calculateExpectedAmount = (amount: number, fromCurrency: string, toCurrency: string): string => {
    const rate = getExchangeRate(fromCurrency, toCurrency);
    if (!rate) return 'N/A';
    return (amount * rate).toFixed(2);
  };

  const partyOptions = getAllParties()
    .filter(p => p.partyId !== party)
    .map(p => ({
      key: p.partyId,
      text: `${p.displayName} (${p.role})`,
      value: p.partyId
    }));

  const currencyOptions = availableCurrencies.map(c => ({
    key: c,
    text: c,
    value: c
  }));

  const handleProposeSwap = async () => {
    if (!selectedHolding || !counterparty || !swapAmount || !requestedAmount || !requestedCurrency) {
      showWarning('Please fill in all fields');
      return;
    }

    const amount = parseFloat(swapAmount);
    if (amount > parseFloat(selectedHolding.payload.amount)) {
      showError('Insufficient balance', 'You cannot swap more than your holding amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Simply create the proposal - don't archive the holding
      // The holding will be archived when the swap is accepted (with bank approval)
      await ledger.create(SwapProposal, {
        proposer: party,
        counterparty: counterparty,
        issuer: selectedHolding.payload.issuer,  // Include the bank/issuer
        proposerHoldingCid: selectedHolding.contractId,
        proposerAmount: swapAmount,
        proposerCurrency: selectedHolding.payload.currency,
        requestedAmount: requestedAmount,
        requestedCurrency: requestedCurrency,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      showSuccess(`Swap proposal sent to ${getDisplayName(counterparty)}! Awaiting bank and counterparty approval.`);
      setProposeModalOpen(false);
      resetForm();
    } catch (error) {
      showError('Failed to propose swap', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!selectedHolding || !swapAmount || !requestedAmount || !requestedCurrency) {
      showWarning('Please fill in all fields');
      return;
    }

    const amount = parseFloat(swapAmount);
    if (amount > parseFloat(selectedHolding.payload.amount)) {
      showError('Insufficient balance', 'You cannot offer more than your holding amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Archive the holding and create offer with the holding data locked in
      await ledger.archive(StablecoinHolding, selectedHolding.contractId);
      
      await ledger.create(SwapOffer, {
        offerer: party,
        lockedHolding: selectedHolding.payload,  // Lock the actual holding data
        offerAmount: swapAmount,
        offerCurrency: selectedHolding.payload.currency,
        requestedAmount: requestedAmount,
        requestedCurrency: requestedCurrency,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      showSuccess('Public swap offer created - your ' + selectedHolding.payload.currency + ' is locked');
      setOfferModalOpen(false);
      resetForm();
    } catch (error) {
      showError('Failed to create offer', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!selectedProposal || !selectedAcceptHolding) {
      showWarning('Please select your holding to swap');
      return;
    }

    setIsProcessing(true);
    try {
      // Use the new BankExecuteSwap choice - but this requires bank authorization
      // For now, just show a message
      showWarning('Atomic swaps require bank approval. This feature requires the bank to execute the swap on your behalf. For the demo, this functionality is limited.');
      setAcceptProposalModalOpen(false);
      setSelectedProposal(null);
      setSelectedAcceptHolding(null);
      
      /* 
      // This would be the actual implementation if we had bank authorization:
      await ledger.exercise(SwapProposal.BankExecuteSwap, selectedProposal.contractId, {
        counterpartyHoldingCid: selectedAcceptHolding.contractId,
      });
      showSuccess('Swap completed successfully!');
      */
    } catch (error) {
      showError('Failed to accept swap', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer || !selectedAcceptHolding) {
      showWarning('Please select your holding to swap');
      return;
    }

    setIsProcessing(true);
    try {
      // Similar limitation - requires bank authorization
      showWarning('Atomic swaps require bank approval. This feature requires the bank to execute the swap on your behalf. For the demo, this functionality is limited.');
      setAcceptOfferModalOpen(false);
      setSelectedOffer(null);
      setSelectedAcceptHolding(null);
      
      /*
      // This would work if we had bank authorization:
      await ledger.exercise(SwapOffer.BankExecuteSwapOffer, selectedOffer.contractId, {
        acceptor: party,
        acceptorHoldingCid: selectedAcceptHolding.contractId,
      });
      showSuccess('Swap completed successfully!');
      */
    } catch (error) {
      showError('Failed to accept offer', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProposal = async (proposalCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(SwapProposal.RejectSwap, proposalCid, {});
      showSuccess('Swap proposal rejected');
    } catch (error) {
      showError('Failed to reject proposal', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelProposal = async (proposalCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(SwapProposal.CancelSwap, proposalCid, {});
      showSuccess('Swap proposal cancelled');
    } catch (error) {
      showError('Failed to cancel proposal', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOffer = async (offerCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(SwapOffer.CancelSwapOffer, offerCid, {});
      showSuccess('Swap offer cancelled');
    } catch (error) {
      showError('Failed to cancel offer', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openAcceptProposalModal = (proposal: any) => {
    setSelectedProposal(proposal);
    setSelectedAcceptHolding(null);
    setSelectedProposerHolding(null);
    setAcceptProposalModalOpen(true);
  };

  const openAcceptOfferModal = (offer: any) => {
    setSelectedOffer(offer);
    setSelectedAcceptHolding(null);
    setSelectedOffererHolding(null);
    setAcceptOfferModalOpen(true);
  };

  const resetForm = () => {
    setSelectedHolding(null);
    setCounterparty('');
    setSwapAmount('');
    setRequestedAmount('');
    setRequestedCurrency('');
  };

  if (holdingsLoading || proposalsLoading || offersLoading || ratesLoading) {
    return <h1>Loading swaps...</h1>;
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              <Icon name='exchange' />
              Atomic Swaps
            </Header>

            {/* Exchange Rates */}
            <Segment>
              <Header as='h2'>
                <Icon name='chart line' color='green' />
                <Header.Content>
                  Current Exchange Rates
                  <Header.Subheader>Bank-provided rates for currency conversion</Header.Subheader>
                </Header.Content>
              </Header>

              <Grid columns={2} divided>
                {exchangeRates.map(rate => (
                  <Grid.Column key={rate.contractId}>
                    <Segment textAlign='center'>
                      <Label size='large' color='blue'>
                        1 {rate.payload.fromCurrency} = {parseFloat(rate.payload.rate).toFixed(4)} {rate.payload.toCurrency}
                      </Label>
                      <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                        Updated: {rate.payload.lastUpdated}
                      </div>
                    </Segment>
                  </Grid.Column>
                ))}
              </Grid>
            </Segment>

            {/* Action Buttons */}
            <Segment>
              <Button.Group fluid size='large'>
                <Button
                  color='blue'
                  onClick={() => setProposeModalOpen(true)}
                  disabled={myHoldings.length === 0}
                >
                  <Icon name='handshake' />
                  Propose Swap
                </Button>
                <Button
                  color='teal'
                  onClick={() => setOfferModalOpen(true)}
                  disabled={myHoldings.length === 0}
                >
                  <Icon name='bullhorn' />
                  Create Public Offer
                </Button>
              </Button.Group>
            </Segment>

            {/* Incoming Swap Proposals */}
            <Segment>
              <Header as='h2'>
                <Icon name='inbox' color='green' />
                <Header.Content>
                  Incoming Swap Proposals
                  <Header.Subheader>Direct swap requests from other users</Header.Subheader>
                </Header.Content>
              </Header>

              {incomingProposals.length === 0 ? (
                <Message info>No incoming swap proposals</Message>
              ) : (
                <Card.Group>
                  {incomingProposals.map(proposal => (
                    <Card key={proposal.contractId} fluid color='green'>
                      <Card.Content>
                        <Card.Header>
                          Swap Proposal from {getDisplayName(proposal.payload.proposer)}
                        </Card.Header>
                        <Card.Meta>Expires: {proposal.payload.expiryDate}</Card.Meta>
                        <Card.Description style={{ marginTop: '1em' }}>
                          <p><strong>They offer:</strong> ${parseFloat(proposal.payload.proposerAmount).toFixed(2)} {proposal.payload.proposerCurrency}</p>
                          <p><strong>They want:</strong> ${parseFloat(proposal.payload.requestedAmount).toFixed(2)} {proposal.payload.requestedCurrency}</p>
                        </Card.Description>
                      </Card.Content>
                      <Card.Content extra>
                        <Button.Group fluid>
                          <Button
                            positive
                            onClick={() => openAcceptProposalModal(proposal)}
                            disabled={isProcessing}
                          >
                            <Icon name='check' />
                            Accept
                          </Button>
                          <Button
                            negative
                            onClick={() => handleRejectProposal(proposal.contractId)}
                            disabled={isProcessing}
                          >
                            <Icon name='close' />
                            Reject
                          </Button>
                        </Button.Group>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Group>
              )}
            </Segment>

            {/* Outgoing Swap Proposals */}
            {outgoingProposals.length > 0 && (
              <Segment>
                <Header as='h2'>
                  <Icon name='paper plane' color='orange' />
                  Outgoing Swap Proposals
                </Header>

                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Counterparty</Table.HeaderCell>
                      <Table.HeaderCell>You Offer</Table.HeaderCell>
                      <Table.HeaderCell>You Want</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {outgoingProposals.map(proposal => (
                      <Table.Row key={proposal.contractId}>
                        <Table.Cell>{getDisplayName(proposal.payload.counterparty)}</Table.Cell>
                        <Table.Cell>${parseFloat(proposal.payload.proposerAmount).toFixed(2)} {proposal.payload.proposerCurrency}</Table.Cell>
                        <Table.Cell>${parseFloat(proposal.payload.requestedAmount).toFixed(2)} {proposal.payload.requestedCurrency}</Table.Cell>
                        <Table.Cell>
                          <Button
                            size='small'
                            color='red'
                            onClick={() => handleCancelProposal(proposal.contractId)}
                            disabled={isProcessing}
                          >
                            Cancel
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Segment>
            )}

            {/* Public Swap Offers */}
            <Segment>
              <Header as='h2'>
                <Icon name='shopping cart' color='purple' />
                <Header.Content>
                  Public Swap Offers
                  <Header.Subheader>Open offers anyone can accept</Header.Subheader>
                </Header.Content>
              </Header>

              {publicOffers.length === 0 ? (
                <Message info>No public swap offers available</Message>
              ) : (
                <Card.Group>
                  {publicOffers.map(offer => (
                    <Card key={offer.contractId} fluid color='purple'>
                      <Card.Content>
                        <Card.Header>
                          Offer by {getDisplayName(offer.payload.offerer)}
                        </Card.Header>
                        <Card.Meta>Expires: {offer.payload.expiryDate}</Card.Meta>
                        <Card.Description style={{ marginTop: '1em' }}>
                          <p><strong>They offer:</strong> ${parseFloat(offer.payload.offerAmount).toFixed(2)} {offer.payload.offerCurrency}</p>
                          <p><strong>They want:</strong> ${parseFloat(offer.payload.requestedAmount).toFixed(2)} {offer.payload.requestedCurrency}</p>
                          {getExchangeRate(offer.payload.offerCurrency, offer.payload.requestedCurrency) && (
                            <p style={{ color: '#666', fontSize: '0.9em' }}>
                              Expected rate: 1 {offer.payload.offerCurrency} = {getExchangeRate(offer.payload.offerCurrency, offer.payload.requestedCurrency)?.toFixed(4)} {offer.payload.requestedCurrency}
                            </p>
                          )}
                        </Card.Description>
                      </Card.Content>
                      <Card.Content extra>
                        <Button
                          color='purple'
                          fluid
                          onClick={() => openAcceptOfferModal(offer)}
                          disabled={isProcessing}
                        >
                          <Icon name='check' />
                          Accept Offer
                        </Button>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Group>
              )}
            </Segment>

            {/* My Public Offers */}
            {myOffers.length > 0 && (
              <Segment>
                <Header as='h2'>
                  <Icon name='clipboard list' color='teal' />
                  My Public Offers
                </Header>

                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>I Offer</Table.HeaderCell>
                      <Table.HeaderCell>I Want</Table.HeaderCell>
                      <Table.HeaderCell>Expires</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {myOffers.map(offer => (
                      <Table.Row key={offer.contractId}>
                        <Table.Cell>${parseFloat(offer.payload.offerAmount).toFixed(2)} {offer.payload.offerCurrency}</Table.Cell>
                        <Table.Cell>${parseFloat(offer.payload.requestedAmount).toFixed(2)} {offer.payload.requestedCurrency}</Table.Cell>
                        <Table.Cell>{offer.payload.expiryDate}</Table.Cell>
                        <Table.Cell>
                          <Button
                            size='small'
                            color='red'
                            onClick={() => handleCancelOffer(offer.contractId)}
                            disabled={isProcessing}
                          >
                            Cancel
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Segment>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Propose Swap Modal */}
      <Modal open={proposeModalOpen} onClose={() => setProposeModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='handshake' color='blue' />
          Propose Currency Swap
        </Modal.Header>
        <Modal.Content>
          <Message info>
            <Message.Header>Direct Swap Proposal</Message.Header>
            <p>Propose a swap to a specific user. Both parties must have the required currencies.</p>
          </Message>
          <Form>
            <Form.Field required>
              <label>Select Your Holding</label>
              <Card.Group>
                {myHoldings.map(holding => (
                  <Card
                    key={holding.contractId}
                    fluid
                    color={selectedHolding?.contractId === holding.contractId ? 'blue' : undefined}
                    onClick={() => setSelectedHolding(holding)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Content>
                      <Card.Header>
                        {selectedHolding?.contractId === holding.contractId && <Icon name='check circle' color='blue' />}
                        ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                      </Card.Header>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Form.Field>

            {selectedHolding && (
              <>
                <Form.Field required>
                  <label>Amount to Swap</label>
                  <Input
                    type='number'
                    placeholder='Enter amount...'
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    max={selectedHolding.payload.amount}
                    label={{ basic: true, content: selectedHolding.payload.currency }}
                    labelPosition='right'
                  />
                </Form.Field>

                <Form.Field required>
                  <label>Counterparty</label>
                  <Dropdown
                    placeholder='Select recipient'
                    fluid
                    selection
                    options={partyOptions}
                    value={counterparty}
                    onChange={(e, { value }) => setCounterparty(value as string)}
                  />
                </Form.Field>

                <Form.Field required>
                  <label>Requested Currency</label>
                  <Dropdown
                    placeholder='Select currency'
                    fluid
                    selection
                    options={currencyOptions.filter(c => c.value !== selectedHolding.payload.currency)}
                    value={requestedCurrency}
                    onChange={(e, { value }) => setRequestedCurrency(value as string)}
                  />
                </Form.Field>

                <Form.Field required>
                  <label>Requested Amount</label>
                  <Input
                    type='number'
                    placeholder='Enter amount...'
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    label={{ basic: true, content: requestedCurrency || 'Currency' }}
                    labelPosition='right'
                  />
                  {swapAmount && requestedCurrency && selectedHolding && (
                    <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                      Expected: ${calculateExpectedAmount(parseFloat(swapAmount), selectedHolding.payload.currency, requestedCurrency)} {requestedCurrency}
                    </div>
                  )}
                </Form.Field>
              </>
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setProposeModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='blue'
            disabled={!selectedHolding || !counterparty || !swapAmount || !requestedAmount || !requestedCurrency || isProcessing}
            loading={isProcessing}
            onClick={handleProposeSwap}
          >
            <Icon name='check' />
            Propose Swap
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Create Public Offer Modal */}
      <Modal open={offerModalOpen} onClose={() => setOfferModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='bullhorn' color='teal' />
          Create Public Swap Offer
        </Modal.Header>
        <Modal.Content>
          <Message info>
            <Message.Header>Public Offer</Message.Header>
            <p>Create an open offer that anyone can accept if they have the requested currency.</p>
          </Message>
          <Form>
            <Form.Field required>
              <label>Select Your Holding</label>
              <Card.Group>
                {myHoldings.map(holding => (
                  <Card
                    key={holding.contractId}
                    fluid
                    color={selectedHolding?.contractId === holding.contractId ? 'teal' : undefined}
                    onClick={() => setSelectedHolding(holding)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Content>
                      <Card.Header>
                        {selectedHolding?.contractId === holding.contractId && <Icon name='check circle' color='teal' />}
                        ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                      </Card.Header>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Form.Field>

            {selectedHolding && (
              <>
                <Form.Field required>
                  <label>Amount to Offer</label>
                  <Input
                    type='number'
                    placeholder='Enter amount...'
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    max={selectedHolding.payload.amount}
                    label={{ basic: true, content: selectedHolding.payload.currency }}
                    labelPosition='right'
                  />
                </Form.Field>

                <Form.Field required>
                  <label>Requested Currency</label>
                  <Dropdown
                    placeholder='Select currency'
                    fluid
                    selection
                    options={currencyOptions.filter(c => c.value !== selectedHolding.payload.currency)}
                    value={requestedCurrency}
                    onChange={(e, { value }) => setRequestedCurrency(value as string)}
                  />
                </Form.Field>

                <Form.Field required>
                  <label>Requested Amount</label>
                  <Input
                    type='number'
                    placeholder='Enter amount...'
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    label={{ basic: true, content: requestedCurrency || 'Currency' }}
                    labelPosition='right'
                  />
                  {swapAmount && requestedCurrency && selectedHolding && (
                    <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                      Expected: ${calculateExpectedAmount(parseFloat(swapAmount), selectedHolding.payload.currency, requestedCurrency)} {requestedCurrency}
                    </div>
                  )}
                </Form.Field>
              </>
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setOfferModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='teal'
            disabled={!selectedHolding || !swapAmount || !requestedAmount || !requestedCurrency || isProcessing}
            loading={isProcessing}
            onClick={handleCreateOffer}
          >
            <Icon name='check' />
            Create Offer
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Accept Proposal Modal */}
      <Modal open={acceptProposalModalOpen} onClose={() => setAcceptProposalModalOpen(false)} size='small'>
        <Modal.Header>Accept Swap Proposal</Modal.Header>
        <Modal.Content>
          {selectedProposal && (
            <>
              <Segment color='blue'>
                <Header as='h4'>Swap Details</Header>
                <p><strong>They offer:</strong> ${parseFloat(selectedProposal.payload.proposerAmount).toFixed(2)} {selectedProposal.payload.proposerCurrency}</p>
                <p><strong>They want:</strong> ${parseFloat(selectedProposal.payload.requestedAmount).toFixed(2)} {selectedProposal.payload.requestedCurrency}</p>
              </Segment>

              <Header as='h4'>Select Your Holding to Swap:</Header>
              <Card.Group>
                {myHoldings.filter(h => h.payload.currency === selectedProposal.payload.requestedCurrency).map(holding => (
                  <Card
                    key={holding.contractId}
                    fluid
                    color={selectedAcceptHolding?.contractId === holding.contractId ? 'green' : undefined}
                    onClick={() => setSelectedAcceptHolding(holding)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Content>
                      <Card.Header>
                        {selectedAcceptHolding?.contractId === holding.contractId && <Icon name='check circle' color='green' />}
                        ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                      </Card.Header>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setAcceptProposalModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='green'
            disabled={!selectedAcceptHolding || isProcessing}
            loading={isProcessing}
            onClick={handleAcceptProposal}
          >
            <Icon name='check' />
            Accept Swap
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Accept Offer Modal */}
      <Modal open={acceptOfferModalOpen} onClose={() => setAcceptOfferModalOpen(false)} size='small'>
        <Modal.Header>Accept Swap Offer</Modal.Header>
        <Modal.Content>
          {selectedOffer && (
            <>
              <Segment color='purple'>
                <Header as='h4'>Offer Details</Header>
                <p><strong>They offer:</strong> ${parseFloat(selectedOffer.payload.offerAmount).toFixed(2)} {selectedOffer.payload.offerCurrency} (locked in offer)</p>
                <p><strong>They want:</strong> ${parseFloat(selectedOffer.payload.requestedAmount).toFixed(2)} {selectedOffer.payload.requestedCurrency}</p>
              </Segment>

              <Header as='h4'>Select Your {selectedOffer.payload.requestedCurrency} Holding:</Header>
              <Card.Group>
                {myHoldings.filter(h => h.payload.currency === selectedOffer.payload.requestedCurrency).map(holding => (
                  <Card
                    key={holding.contractId}
                    fluid
                    color={selectedAcceptHolding?.contractId === holding.contractId ? 'purple' : undefined}
                    onClick={() => setSelectedAcceptHolding(holding)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Content>
                      <Card.Header>
                        {selectedAcceptHolding?.contractId === holding.contractId && <Icon name='check circle' color='purple' />}
                        ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                      </Card.Header>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setAcceptOfferModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='purple'
            disabled={!selectedAcceptHolding || isProcessing}
            loading={isProcessing}
            onClick={handleAcceptOffer}
          >
            <Icon name='check' />
            Accept Offer
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default AtomicSwaps;