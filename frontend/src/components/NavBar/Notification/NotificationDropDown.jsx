import Dropdown from 'react-bootstrap/Dropdown'
import React, { useState } from 'react';
import { MdOutlineNotificationsNone } from 'react-icons/md';
import DropdownMenu from 'react-bootstrap/esm/DropdownMenu';

export default function NotificationDropDown({iconSize}) {
    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <a
          href=""
          ref={ref}
          onClick={(e) => {
            e.preventDefault();
            onClick(e);
          }}
        >
          {children}
        </a>
      ));

    return(
        <>
        <Dropdown>
            <Dropdown.Toggle as = {CustomToggle}>
            <MdOutlineNotificationsNone size={iconSize} className='text-dark'/>
            </Dropdown.Toggle>

            <DropdownMenu>
                <div className='d-flex flex-row ms-1'>
                <input type="checkbox" />
                <div className='ms-1'>모두읽음</div>
                </div>
                
                <Dropdown.Item>
                    [ChatGPT 개발자 되기] 팀 지원이 승인 되었습니다.
                </Dropdown.Item>
            </DropdownMenu>
        </Dropdown>
        </>
        
    );
}
