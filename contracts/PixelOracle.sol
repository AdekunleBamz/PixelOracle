// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PixelOracle
 * @dev Autonomous AI Artist NFT Collection on Base
 * @notice This contract allows an AI agent to mint unique artworks
 */
contract PixelOracle is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    
    // ============================================
    // State Variables
    // ============================================
    
    uint256 private _tokenIdCounter;
    uint256 public mintPrice = 0.001 ether;
    uint256 public maxSupply = 10000;
    
    // Track creation timestamps
    mapping(uint256 => uint256) public creationTime;
    
    // Track AI generation prompts (hash for gas efficiency)
    mapping(uint256 => bytes32) public promptHash;
    
    // Events
    event ArtworkCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string metadataURI,
        uint256 timestamp
    );
    
    event OracleVision(
        uint256 indexed tokenId,
        string theme,
        string message
    );

    // ============================================
    // Constructor
    // ============================================
    
    constructor() ERC721("PixelOracle", "PXLO") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    // ============================================
    // Core Minting Functions
    // ============================================
    
    /**
     * @dev Mint a new artwork (Agent only)
     * @param to Recipient address
     * @param metadataURI IPFS URI for the artwork metadata
     * @param _promptHash Hash of the AI prompt used
     */
    function mintArtwork(
        address to,
        string memory metadataURI,
        bytes32 _promptHash
    ) external onlyOwner nonReentrant returns (uint256) {
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        creationTime[tokenId] = block.timestamp;
        promptHash[tokenId] = _promptHash;
        
        emit ArtworkCreated(tokenId, to, metadataURI, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @dev Public mint function for collectors
     * @param metadataURI IPFS URI for the artwork metadata
     */
    function publicMint(string memory metadataURI) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        creationTime[tokenId] = block.timestamp;
        
        emit ArtworkCreated(tokenId, msg.sender, metadataURI, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @dev Emit a vision/message from the Oracle (for social engagement)
     */
    function emitVision(
        uint256 tokenId,
        string memory theme,
        string memory message
    ) external onlyOwner {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        emit OracleVision(tokenId, theme, message);
    }

    // ============================================
    // View Functions
    // ============================================
    
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function getCreationTime(uint256 tokenId) external view returns (uint256) {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        return creationTime[tokenId];
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }
    
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= _tokenIdCounter, "Cannot set below current supply");
        maxSupply = newMaxSupply;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // ============================================
    // Required Overrides
    // ============================================
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
