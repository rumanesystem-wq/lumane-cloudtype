import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/live/LiveAdmin', () => ({
  LiveAdmin: () => <label>상담 답장<textarea /></label>,
}));

import { AdminApp } from '../src/AdminApp';

describe('Admin workspace', () => {
  it('groups the curated business areas without duplicating primary navigation', () => {
    render(<AdminApp />);
    const navigation = screen.getByRole('navigation');
    expect(navigation).toHaveTextContent('홈');
    expect(navigation).toHaveTextContent('상담');
    expect(navigation).toHaveTextContent('견적');
    expect(navigation).toHaveTextContent('분석');
    expect(navigation).toHaveTextContent('데이터 관리');
    expect(screen.getAllByRole('button', { name: /견적/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /견적.*접수·편집/ }));
    expect(screen.getByRole('heading', { name: '견적 업무' })).toBeVisible();
    expect(screen.getByRole('link', { name: '기존 화면에서 견적 열기' })).toHaveAttribute('href', '/admin#quotes');
  });

  it('opens and closes the mobile navigation without changing the active area', () => {
    render(<AdminApp />);
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }));
    expect(screen.queryByRole('button', { name: '메뉴 닫기' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '운영 홈' })).toBeVisible();
  });

  it('keeps conversation state while moving between workspace areas', () => {
    render(<AdminApp />);
    fireEvent.click(screen.getByRole('button', { name: /진행 중 상담.*현재 연결/ }));
    const reply = screen.getByLabelText('상담 답장');
    fireEvent.change(reply, { target: { value: '작성 중인 답장' } });
    fireEvent.click(screen.getByRole('button', { name: /견적.*접수·편집/ }));
    fireEvent.click(screen.getByRole('button', { name: /상담.*진행 중/ }));
    expect(screen.getByLabelText('상담 답장')).toHaveValue('작성 중인 답장');
  });

  it('closes the mobile navigation with Escape and restores page scrolling', () => {
    render(<AdminApp />);
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(document.body).toHaveClass('has-mobile-menu');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: '메뉴 닫기' })).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('has-mobile-menu');
  });
});
