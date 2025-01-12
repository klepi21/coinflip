export const contractAbi = {
  "buildInfo": {
    "rustc": {
      "version": "1.80.1",
      "commitHash": "3f5fd8dd41153bc5fdca9427e9e05be2c767ba23",
      "commitDate": "2024-08-06",
      "channel": "Stable",
      "short": "rustc 1.80.1 (3f5fd8dd4 2024-08-06)"
    },
    "contractCrate": {
      "name": "lib",
      "version": "0.0.0"
    },
    "framework": {
      "name": "multiversx-sc",
      "version": "0.54.5"
    }
  },
  "name": "QuantumXFees",
  "constructor": {
    "docs": [
      "Initializes the contract.",
      "",
      "#### Notes:",
      "",
      "- No input is given for the deployment.",
      "- The Admins can be set in order to be able to add/remove earners.",
      "- The SC owner is considered an Admin by default."
    ],
    "inputs": [],
    "outputs": []
  },
  "upgradeConstructor": {
    "inputs": [],
    "outputs": []
  },
  "endpoints": [
    {
      "name": "setEarner",
      "mutability": "mutable",
      "inputs": [
        {
          "name": "address",
          "type": "Address"
        },
        {
          "name": "name",
          "type": "bytes"
        },
        {
          "name": "percentage",
          "type": "u64"
        }
      ],
      "outputs": []
    },
    {
      "name": "removeEarner",
      "mutability": "mutable",
      "inputs": [
        {
          "name": "address",
          "type": "Address"
        }
      ],
      "outputs": []
    },
    {
      "name": "addAdmins",
      "onlyOwner": true,
      "mutability": "mutable",
      "inputs": [
        {
          "name": "admins",
          "type": "variadic<Address>",
          "multi_arg": true
        }
      ],
      "outputs": []
    },
    {
      "name": "removeAdmins",
      "onlyOwner": true,
      "mutability": "mutable",
      "inputs": [
        {
          "name": "admins",
          "type": "variadic<Address>",
          "multi_arg": true
        }
      ],
      "outputs": []
    },
    {
      "docs": [
        "Returns the list of earners with their name and percentage."
      ],
      "name": "getEarnersInfo",
      "mutability": "readonly",
      "inputs": [],
      "outputs": [
        {
          "type": "variadic<multi<Address,bytes,u64>>",
          "multi_result": true
        }
      ]
    },
    {
      "name": "getAdmins",
      "mutability": "readonly",
      "inputs": [],
      "outputs": [
        {
          "type": "variadic<Address>",
          "multi_result": true
        }
      ]
    },
    {
      "docs": [
        "Accepts an EGLD/ESDT transfer and distributes it to the earners."
      ],
      "name": "transfer",
      "mutability": "mutable",
      "payableInTokens": [
        "*"
      ],
      "inputs": [],
      "outputs": []
    },
    {
      "docs": [
        "Accepts a list of EGLD/ESDT tokens and distributes their balances to the earners."
      ],
      "name": "share",
      "mutability": "mutable",
      "inputs": [
        {
          "name": "token_identifiers",
          "type": "variadic<EgldOrEsdtTokenIdentifier>",
          "multi_arg": true
        }
      ],
      "outputs": []
    }
  ],
  "events": [
    {
      "identifier": "set_earner",
      "inputs": [
        {
          "name": "address",
          "type": "Address",
          "indexed": true
        },
        {
          "name": "name",
          "type": "bytes",
          "indexed": true
        },
        {
          "name": "percentage",
          "type": "u64",
          "indexed": true
        }
      ]
    },
    {
      "identifier": "remove_earner",
      "inputs": [
        {
          "name": "address",
          "type": "Address",
          "indexed": true
        }
      ]
    },
    {
      "identifier": "add_admins",
      "inputs": [
        {
          "name": "admins",
          "type": "List<Address>"
        }
      ]
    },
    {
      "identifier": "remove_admins",
      "inputs": [
        {
          "name": "admins",
          "type": "List<Address>"
        }
      ]
    }
  ],
  "esdtAttributes": [],
  "hasCallback": false,
  "types": {}
};