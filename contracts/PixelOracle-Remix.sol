// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PixelOracle - Autonomous AI Artist NFT Collection on Base
 * @dev Deploy this contract via Remix IDE on Base network
 * 
 * DEPLOYED CONTRACT ADDRESS (Base Mainnet):
 * 0x09ED29b4b822a41bf14B2efE8C54bA753A35d5B6
 * 
 * REMIX DEPLOYMENT INSTRUCTIONS:
 * 1. Open remix.ethereum.org
 * 2. Create new file, paste this code
 * 3. Compile with Solidity 0.8.24+
 * 4. Deploy -> Injected Provider (MetaMask on Base)
 * 5. Copy the deployed contract address for your agent
 */

// ============================================
// OpenZeppelin Interfaces & Libraries (Flattened)
// ============================================

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Enumerable is IERC721 {
    function totalSupply() external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    
    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert OwnableInvalidOwner(address(0));
        _transferOwnership(initialOwner);
    }
    
    modifier onlyOwner() {
        _checkOwner();
        _;
    }
    
    function owner() public view virtual returns (address) {
        return _owner;
    }
    
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) revert OwnableUnauthorizedAccount(_msgSender());
    }
    
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }
    
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) revert OwnableInvalidOwner(address(0));
        _transferOwnership(newOwner);
    }
    
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    
    error ReentrancyGuardReentrantCall();
    
    constructor() {
        _status = NOT_ENTERED;
    }
    
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }
    
    function _nonReentrantBefore() private {
        if (_status == ENTERED) revert ReentrancyGuardReentrantCall();
        _status = ENTERED;
    }
    
    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }
}

abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

contract ERC721 is Context, ERC165, IERC721, IERC721Metadata {
    using Strings for uint256;
    
    string private _name;
    string private _symbol;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }
    
    function balanceOf(address owner) public view virtual returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner];
    }
    
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }
    
    function name() public view virtual returns (string memory) {
        return _name;
    }
    
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }
    
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        require(_owners[tokenId] != address(0), "ERC721: invalid token ID");
        return "";
    }
    
    function approve(address to, uint256 tokenId) public virtual {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()), "ERC721: approve caller is not owner nor approved for all");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view virtual returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: invalid token ID");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public virtual {
        require(operator != _msgSender(), "ERC721: approve to caller");
        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }
    
    function isApprovedForAll(address owner, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }
    
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }
    
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }
    
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }
    
    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }
    
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) revert("ERC721: transfer to non ERC721Receiver implementer");
                assembly { revert(add(32, reason), mload(reason)) }
            }
        }
        return true;
    }
}

// ============================================
// PixelOracle - Main Contract
// ============================================

/**
 * @title PixelOracle
 * @dev Autonomous AI Artist NFT Collection on Base
 * @notice This contract allows an AI agent to mint unique AI-generated artworks
 */
contract PixelOracle is ERC721, Ownable, ReentrancyGuard {
    
    using Strings for uint256;
    
    // ============================================
    // State Variables
    // ============================================
    
    uint256 private _tokenIdCounter;
    uint256 public mintPrice = 0.0001 ether;  // Low price for Base
    uint256 public maxSupply = 10000;
    
    // Token URI storage
    mapping(uint256 => string) private _tokenURIs;
    
    // Track creation timestamps
    mapping(uint256 => uint256) public creationTime;
    
    // Track AI generation prompts (hash for gas efficiency)
    mapping(uint256 => bytes32) public promptHash;
    
    // Track themes for each artwork
    mapping(uint256 => string) public artworkTheme;
    
    // ============================================
    // Events
    // ============================================
    
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
    
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

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
     * @dev Mint a new artwork (Agent/Owner only)
     * @param to Recipient address
     * @param metadataURI IPFS URI for the artwork metadata
     * @param _promptHash Hash of the AI prompt used
     * @param theme The theme/style of the artwork
     */
    function mintArtwork(
        address to,
        string memory metadataURI,
        bytes32 _promptHash,
        string memory theme
    ) external onlyOwner nonReentrant returns (uint256) {
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        
        creationTime[tokenId] = block.timestamp;
        promptHash[tokenId] = _promptHash;
        artworkTheme[tokenId] = theme;
        
        emit ArtworkCreated(tokenId, to, metadataURI, block.timestamp);
        emit OracleVision(tokenId, theme, "A new vision emerges from the digital ether");
        
        return tokenId;
    }
    
    /**
     * @dev Simple mint for agent (no theme tracking)
     */
    function mint(
        address to,
        string memory metadataURI
    ) external onlyOwner nonReentrant returns (uint256) {
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        creationTime[tokenId] = block.timestamp;
        
        emit ArtworkCreated(tokenId, to, metadataURI, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @dev Public mint function for collectors
     */
    function publicMint(string memory metadataURI) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        creationTime[tokenId] = block.timestamp;
        
        emit ArtworkCreated(tokenId, msg.sender, metadataURI, block.timestamp);
        
        return tokenId;
    }

    // ============================================
    // View Functions
    // ============================================
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get artwork details
     */
    function getArtworkDetails(uint256 tokenId) external view returns (
        address owner_,
        string memory uri,
        uint256 created,
        bytes32 prompt,
        string memory theme
    ) {
        require(_exists(tokenId), "Token does not exist");
        return (
            ownerOf(tokenId),
            _tokenURIs[tokenId],
            creationTime[tokenId],
            promptHash[tokenId],
            artworkTheme[tokenId]
        );
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
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
    // Receive ETH
    // ============================================
    
    receive() external payable {}
}
