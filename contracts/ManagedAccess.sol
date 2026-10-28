// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;
    // 매니저가 다수 -> 배열로 하면 될것 같고
    // 매니저 별로 별도의 confirm여부를 보유 -> mapping
    // 매니저의 수가 3 이상이 요구됨(require를 활용해서)
    // 매니저들이 모두 confirm을 해야만 정상 작동 -> total_confirm_count 필요 -> 매니저 수와 비교하는 형식
    // 테스트 시 revert 시 total_confirm_count를 초기화됨.
    // 승인을 별도 함수로 빼야함

    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => mapping(address => bool)) public isConfirmed;
    uint256 public totalConfirmCnt;
    uint256 public totalManagers;

    constructor(address _owner, address[] memory _managers) {
        require(_managers.length >= 3);
        owner = _owner;
        managers = _managers;

        for (uint256 i = 0; i < _managers.length; i++) {
            address mgr = managers[i];
            isManager[mgr] = true;
        }
        totalManagers = _managers.length;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not athorized");
        _;
    }
    modifier onlyManager() {
        require(
            isManager[msg.sender],
            "You are not authorized to manage this contract"
        );
        _;
    }
    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");
        require(totalConfirmCnt == totalManagers, "Not all confirmed yet");
        _;
    }
    function confirm() external onlyManager {
        isConfirmed[msg.sender][address(this)] = true;
        uint256 currentCnt = 0;
        for (uint256 i = 0; i < managers.length; i++) {
            if (isConfirmed[managers[i]][address(this)]) {
                currentCnt++;
            }
        }
        totalConfirmCnt = currentCnt;
    }
}
