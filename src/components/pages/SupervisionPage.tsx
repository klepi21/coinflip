'use client';

import { useWallet } from '@/context/WalletContext';
import { Loader2, ShieldAlert, ArrowRight, CheckCircle2, ArrowDownRight, Settings, Coins, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { TokenTransfer, Address } from "@multiversx/sdk-core";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import { toast } from 'sonner';
import { Meteors } from "@/components/ui/meteors";
import * as Tooltip from '@radix-ui/react-tooltip';
import { Squares } from '@/components/ui/squares-background';

const AUTHORIZED_ADDRESSES = [
  'erd1s5ufsgtmzwtp6wrlwtmaqzs24t0p9evmp58p33xmukxwetl8u76sa2p9rv',
  'erd1lnmfa5p9j6qy40kjtrf0wfq6cl056car6hyvrq5uxdcalc2gu7zsrwalel'
];

const PROXY_SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqd9rvv2n378e27jcts8vfwynpx0gfl5ufz6hqhfy0u0';

type Step = 'register' | 'create' | 'initialize';

interface StepIndicatorProps {
  currentStep: Step;
  step: Step;
  label: string;
  isCompleted: boolean;
}

const StepIndicator = ({ currentStep, step, label, isCompleted }: StepIndicatorProps) => (
  <div className="flex items-center gap-3">
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${currentStep === step 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : isCompleted
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-white/10 bg-white/5 text-white/40'}`}
    >
      {isCompleted ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <span className="font-bold">
          {step === 'register' ? '1' : step === 'create' ? '2' : '3'}
        </span>
      )}
    </div>
    <span className={`font-medium ${
      currentStep === step 
        ? 'text-white' 
        : isCompleted
        ? 'text-emerald-500'
        : 'text-white/40'
    }`}>
      {label}
    </span>
  </div>
);

interface RegisterFormProps {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

interface CreateFormProps {
  onSubmit: (data: CreateFundData) => Promise<void>;
  isSubmitting: boolean;
}

interface InitializeFormProps {
  onSubmit: (data: InitializeFundData) => Promise<void>;
  isSubmitting: boolean;
}

interface CreateFundData {
  tokenTicker: string;
  tokenDisplayName: string;
  managerBuyFee: number;
  managerSellFee: number;
  managerPerformanceFee: number;
  tokens: {
    identifier: string;
    weight: number;
  }[];
}

interface InitializeFundData {
  slippage?: number;
}

interface FormErrors {
  tokenTicker?: string;
  tokenDisplayName?: string;
  managerBuyFee?: string;
  managerSellFee?: string;
  managerPerformanceFee?: string;
  tokens?: string[];
}

const RegisterForm = ({ onSubmit, isSubmitting }: RegisterFormProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-primary/10 rounded-xl">
        <Settings className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-lg font-medium text-white">Register New Fund SC</h2>
    </div>

    <p className="text-white/60 mb-6">
      This will deploy a new Liquid Fund smart contract. The contract will be registered
      and ready for configuration in the next step.
    </p>

    <button
      onClick={() => onSubmit()}
      disabled={isSubmitting}
      className="w-full py-3 px-4 rounded-xl bg-primary text-white font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-primary/90 transition-colors"
    >
      {isSubmitting ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      ) : (
        'Register Smart Contract'
      )}
    </button>
  </motion.div>
);

const CreateForm = ({ onSubmit, isSubmitting }: CreateFormProps) => {
  const [formData, setFormData] = useState<CreateFundData>({
    tokenTicker: '',
    tokenDisplayName: '',
    managerBuyFee: 0,
    managerSellFee: 0,
    managerPerformanceFee: 0,
    tokens: [{ identifier: '', weight: 0 }]
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Basic validations
    if (!formData.tokenTicker) {
      newErrors.tokenTicker = 'Token ticker is required';
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.tokenTicker)) {
      newErrors.tokenTicker = 'Ticker must be 3-10 uppercase characters or numbers';
    }

    if (!formData.tokenDisplayName) {
      newErrors.tokenDisplayName = 'Display name is required';
    }

    // Fee validations
    if (formData.managerBuyFee < 0 || formData.managerBuyFee > 100) {
      newErrors.managerBuyFee = 'Fee must be between 0 and 100';
    }
    if (formData.managerSellFee < 0 || formData.managerSellFee > 100) {
      newErrors.managerSellFee = 'Fee must be between 0 and 100';
    }
    if (formData.managerPerformanceFee < 0 || formData.managerPerformanceFee > 100) {
      newErrors.managerPerformanceFee = 'Fee must be between 0 and 100';
    }

    // Token validations
    const tokenErrors: string[] = [];
    let totalWeight = 0;

    formData.tokens.forEach((token, index) => {
      if (!token.identifier) {
        tokenErrors[index] = 'Token identifier is required';
      }
      if (token.weight <= 0 || token.weight > 100) {
        tokenErrors[index] = 'Weight must be between 1 and 100';
      }
      totalWeight += token.weight;
    });

    if (totalWeight !== 100) {
      newErrors.tokens = ['Total weight must equal 100%'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addToken = () => {
    setFormData(prev => ({
      ...prev,
      tokens: [...prev.tokens, { identifier: '', weight: 0 }]
    }));
  };

  const removeToken = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tokens: prev.tokens.filter((_, i) => i !== index)
    }));
  };

  const updateToken = (index: number, field: 'identifier' | 'weight', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      tokens: prev.tokens.map((token, i) => 
        i === index ? { ...token, [field]: value } : token
      )
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Coins className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-white">Create Fund</h2>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Token Ticker</label>
            <input
              type="text"
              value={formData.tokenTicker}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tokenTicker: e.target.value.toUpperCase() 
              }))}
              className={`w-full bg-black/20 border rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none focus:border-primary/50
                       transition-colors ${errors.tokenTicker ? 'border-rose-500' : 'border-white/10'}`}
              placeholder="e.g., DEFI"
            />
            {errors.tokenTicker && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-500"
              >
                {errors.tokenTicker}
              </motion.p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Display Name</label>
            <input
              type="text"
              value={formData.tokenDisplayName}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenDisplayName: e.target.value }))}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none focus:border-primary/50"
              placeholder="e.g., DeFi Index"
            />
          </div>
        </div>

        {/* Fees */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Buy Fee (%)</label>
            <input
              type="number"
              value={formData.managerBuyFee}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                managerBuyFee: Number(e.target.value) 
              }))}
              className={`w-full bg-black/20 border rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none focus:border-primary/50
                       transition-colors ${errors.managerBuyFee ? 'border-rose-500' : 'border-white/10'}`}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Sell Fee (%)</label>
            <input
              type="number"
              value={formData.managerSellFee}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                managerSellFee: Number(e.target.value) 
              }))}
              className={`w-full bg-black/20 border rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none focus:border-primary/50
                       transition-colors ${errors.managerSellFee ? 'border-rose-500' : 'border-white/10'}`}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Performance Fee (%)</label>
            <input
              type="number"
              value={formData.managerPerformanceFee}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                managerPerformanceFee: Number(e.target.value) 
              }))}
              className={`w-full bg-black/20 border rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none focus:border-primary/50
                       transition-colors ${errors.managerPerformanceFee ? 'border-rose-500' : 'border-white/10'}`}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>

        {/* Tokens */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/60">Fund Tokens</label>
            <button
              onClick={addToken}
              className="text-primary text-sm hover:text-primary/80 transition-colors"
            >
              + Add Token
            </button>
          </div>

          <AnimatePresence>
            {formData.tokens.map((token, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-5 gap-4 items-center"
              >
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Token Identifier</label>
                  <input
                    type="text"
                    value={token.identifier}
                    onChange={(e) => updateToken(index, 'identifier', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3
                             text-white placeholder-white/20 focus:outline-none focus:border-primary/50"
                    placeholder="e.g., ERD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Weight (%)</label>
                  <input
                    type="number"
                    value={token.weight}
                    onChange={(e) => updateToken(index, 'weight', Number(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3
                             text-white placeholder-white/20 focus:outline-none focus:border-primary/50"
                    min="1"
                    max="100"
                    step="0.01"
                  />
                </div>
                <button
                  onClick={() => removeToken(index)}
                  className="text-white/40 hover:text-rose-500 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-primary text-white font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-primary/90 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'Create Fund'
          )}
        </button>
      </div>
    </motion.div>
  );
};

const InfoTooltip = ({ content }: { content: string }) => (
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button className="ml-1.5 rounded-full p-1 hover:bg-white/5 transition-colors">
          <Info className="w-4 h-4 text-white/40" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-black/90 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/80
                   shadow-xl backdrop-blur-xl max-w-xs z-[100]"
          sideOffset={5}
        >
          {content}
          <Tooltip.Arrow className="fill-white/10" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

interface TransactionStatusProps {
  status: 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

const TransactionStatus = ({ status, message, hash }: TransactionStatusProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`fixed bottom-4 right-4 p-4 rounded-xl backdrop-blur-xl border
              ${status === 'pending' ? 'bg-blue-500/10 border-blue-500/20' :
                status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                'bg-rose-500/10 border-rose-500/20'}`}
  >
    <div className="flex items-center gap-3">
      {status === 'pending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
      {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
      {status === 'error' && <XCircle className="w-5 h-5 text-rose-500" />}
      <div>
        <p className="text-white font-medium">{message}</p>
        {hash && (
          <a
            href={`https://devnet-explorer.multiversx.com/transactions/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            View transaction →
          </a>
        )}
      </div>
    </div>
  </motion.div>
);

const InitializeForm = ({ onSubmit, isSubmitting }: InitializeFormProps) => {
  const [slippage, setSlippage] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const validateAndSubmit = () => {
    if (slippage < 0.1 || slippage > 5) {
      setError('Slippage must be between 0.1% and 5%');
      return;
    }
    onSubmit({ slippage });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl">
          <ArrowDownRight className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-white">Initialize Fund</h2>
        <InfoTooltip content="Set the slippage tolerance for token swaps during initialization. A higher value means more tolerance for price movement." />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-white/60 flex items-center">
            Slippage Tolerance (%)
          </label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => {
              setSlippage(Number(e.target.value));
              setError('');
            }}
            min="0.1"
            max="5"
            step="0.1"
            className={`w-full bg-black/20 border rounded-xl px-4 py-3
                     text-white placeholder-white/20 focus:outline-none focus:border-primary/50
                     transition-colors ${error ? 'border-rose-500' : 'border-white/10'}`}
          />
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs text-rose-500"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={validateAndSubmit}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-primary text-white font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-primary/90 transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing...</span>
            </div>
          ) : (
            'Initialize Fund'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export const SupervisionPage = () => {
  const { address, isLoggedIn } = useWallet();
  const [currentStep, setCurrentStep] = useState<Step>('register');
  const [registeredScAddress, setRegisteredScAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatusProps | null>(null);

  // Auth checks...

  const handleRegisterFund = async () => {
    try {
      setIsSubmitting(true);
      setTransactionStatus({
        status: 'pending',
        message: 'Registering Index Fund SC...'
      });
      
      const registerData = {
        functionName: 'registerIndexFundSc',
        args: ['02'], // Liquid fund type (02 in hex)
        gasLimit: 60000000,
        value: 0,
      };

      const { sessionId } = await sendTransactions({
        transactions: [{
          value: 0,
          data: registerData.functionName,
          receiver: PROXY_SC_ADDRESS,
          gasLimit: registerData.gasLimit
        }],
        transactionsDisplayInfo: {
          processingMessage: 'Registering Index Fund SC',
          errorMessage: 'An error occurred during registration',
          successMessage: 'Index Fund SC registered successfully'
        }
      });

      // Handle success
      setTransactionStatus({
        status: 'success',
        message: 'Smart Contract registered successfully!',
        hash: sessionId // assuming sessionId is the hash
      });
      setCurrentStep('create');

    } catch (error) {
      setTransactionStatus({
        status: 'error',
        message: 'Failed to register Smart Contract'
      });
    } finally {
      setIsSubmitting(false);
      // Clear status after 5 seconds
      setTimeout(() => setTransactionStatus(null), 5000);
    }
  };

  const handleCreateFund = async (data: CreateFundData) => {
    try {
      setIsSubmitting(true);

      const tokenPairs = data.tokens.map(token => 
        `${token.identifier}@${token.weight.toString(16).padStart(2, '0')}`
      ).join('@');

      const createData = {
        functionName: 'createIndexFund',
        args: [
          Buffer.from(data.tokenTicker).toString('hex'),
          Buffer.from(data.tokenDisplayName).toString('hex'),
          data.managerBuyFee.toString(16),
          data.managerSellFee.toString(16),
          data.managerPerformanceFee.toString(16),
          tokenPairs
        ],
        gasLimit: 60000000,
        value: 0
      };

      const { sessionId } = await sendTransactions({
        transactions: [{
          value: 0,
          data: createData.functionName + '@' + createData.args.join('@'),
          receiver: PROXY_SC_ADDRESS,
          gasLimit: createData.gasLimit
        }],
        transactionsDisplayInfo: {
          processingMessage: 'Creating Index Fund',
          errorMessage: 'An error occurred during fund creation',
          successMessage: 'Index Fund created successfully'
        }
      });

      setCurrentStep('initialize');
    } catch (error) {
      console.error('Error creating fund:', error);
      toast.error('Failed to create fund');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitializeFund = async (data: InitializeFundData) => {
    try {
      setIsSubmitting(true);

      const initData = {
        functionName: 'initializeIndexFund',
        args: data.slippage ? [(data.slippage * 100).toString(16)] : [],
        gasLimit: 60000000,
        value: 0
      };

      const { sessionId } = await sendTransactions({
        transactions: [{
          value: 0,
          data: initData.functionName + (initData.args.length ? '@' + initData.args.join('@') : ''),
          receiver: PROXY_SC_ADDRESS,
          gasLimit: initData.gasLimit
        }],
        transactionsDisplayInfo: {
          processingMessage: 'Initializing Index Fund',
          errorMessage: 'An error occurred during initialization',
          successMessage: 'Index Fund initialized successfully'
        }
      });

      // Handle success
      toast.success('Fund setup completed successfully!');
    } catch (error) {
      console.error('Error initializing fund:', error);
      toast.error('Failed to initialize fund');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add form rendering based on current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'register':
        return <RegisterForm onSubmit={handleRegisterFund} isSubmitting={isSubmitting} />;
      case 'create':
        return <CreateForm onSubmit={handleCreateFund} isSubmitting={isSubmitting} />;
      case 'initialize':
        return <InitializeForm onSubmit={handleInitializeFund} isSubmitting={isSubmitting} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] pt-24 relative">
      {/* Background */}
      <div className="fixed inset-0">
        {/* Squares Background */}
        <div className="absolute inset-0 z-0">
          <Squares 
            direction="diagonal"
            speed={0.5}
            squareSize={40}
            borderColor="rgba(255,255,255,0.05)"
            hoverFillColor="rgba(255,255,255,0.02)"
          />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_100%)] z-20" />
      </div>

      {/* Content */}
      <div className="relative z-30 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Steps Indicator */}
          <div className="flex items-center justify-between max-w-2xl mx-auto bg-black/20 p-6 rounded-2xl backdrop-blur-sm">
            <StepIndicator 
              currentStep={currentStep} 
              step="register" 
              label="Register SC" 
              isCompleted={currentStep !== 'register'}
            />
            <ArrowRight className="w-5 h-5 text-white/20" />
            <StepIndicator 
              currentStep={currentStep} 
              step="create" 
              label="Create Fund" 
              isCompleted={currentStep === 'initialize'}
            />
            <ArrowRight className="w-5 h-5 text-white/20" />
            <StepIndicator 
              currentStep={currentStep} 
              step="initialize" 
              label="Initialize" 
              isCompleted={false}
            />
          </div>

          {/* Forms */}
          <div className="max-w-2xl mx-auto mt-8">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
      
      {/* Transaction Status - move to highest z-index */}
      <AnimatePresence>
        {transactionStatus && (
          <div className="z-50 relative">
            <TransactionStatus {...transactionStatus} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}; 